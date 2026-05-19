import Foundation
import Supabase

/// Доступ до даних через Supabase Postgres + RLS.
/// Розділений на: role detection, worker queries, manager queries (Etap 1 — обмежений набір).
struct SupabaseService {
  private var client: SupabaseClient { SupabaseClientProvider.shared }

  // MARK: - Role detection

  /// Визначити роль користувача:
  /// 1. Owner якогось бізнесу → Manager mode + worker рядок (auto-created тригером)
  /// 2. Worker з is_manager=true → Manager mode
  /// 3. Worker без is_manager → Worker mode
  /// 4. Нічого → notLinked
  func detectRole(userId: UUID) async throws -> UserRole {
    // Спочатку шукаємо бізнес де я owner
    let ownedBusinesses: [Business] = try await client
      .from("businesses")
      .select("id,owner_id,name,slug")
      .eq("owner_id", value: userId)
      .limit(1)
      .execute()
      .value

    if let business = ownedBusinesses.first {
      // Я owner — підвантажую свій worker рядок (auto-created тригером)
      let myWorkers: [Worker] = try await client
        .from("workers")
        .select()
        .eq("business_id", value: business.id)
        .eq("user_id", value: userId)
        .limit(1)
        .execute()
        .value
      return .manager(business: business, worker: myWorkers.first)
    }

    // Не owner — шукаємо worker рядок
    let myWorkers: [Worker] = try await client
      .from("workers")
      .select()
      .eq("user_id", value: userId)
      .limit(1)
      .execute()
      .value

    guard let worker = myWorkers.first else {
      return .notLinked
    }

    // Знаходимо business worker'а (потрібно для UI)
    let businesses: [Business] = try await client
      .from("businesses")
      .select("id,owner_id,name,slug")
      .eq("id", value: worker.businessId)
      .limit(1)
      .execute()
      .value

    guard let business = businesses.first else {
      return .notLinked
    }

    return worker.isManager
      ? .manager(business: business, worker: worker)
      : .worker(business: business, worker: worker)
  }

  // MARK: - Bookings (общі для обох ролей)

  /// Дістати bookings за діапазоном дат.
  /// - Якщо `workerId` передано → фільтр тільки роботи цього worker (Worker mode)
  /// - Якщо `workerId` nil → всі bookings бізнесу (Manager mode)
  func bookings(
    businessId: UUID,
    workerId: UUID? = nil,
    from: Date,
    until: Date
  ) async throws -> [BookingWithService] {
    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    var query = client
      .from("bookings")
      .select()
      .eq("business_id", value: businessId)
      .gte("start_at", value: iso.string(from: from))
      .lt("start_at",  value: iso.string(from: until))

    if let wid = workerId {
      query = query.contains("worker_ids", value: [wid.uuidString])
    }

    let bookings: [Booking] = try await query
      .order("start_at", ascending: true)
      .execute()
      .value

    // Долучити назви сервісів одним запитом
    let svcIds = Array(Set(bookings.compactMap { $0.serviceId?.uuidString }))
    var nameById: [UUID: String] = [:]
    if !svcIds.isEmpty {
      struct SvcRow: Codable { let id: UUID; let name: String }
      let svcs: [SvcRow] = try await client
        .from("services")
        .select("id,name")
        .in("id", values: svcIds)
        .execute()
        .value
      for s in svcs { nameById[s.id] = s.name }
    }

    return bookings.map { b in
      BookingWithService(booking: b, serviceName: b.serviceId.flatMap { nameById[$0] })
    }
  }

  // MARK: - Clients

  func clients(ids: [UUID]) async throws -> [UUID: Client] {
    guard !ids.isEmpty else { return [:] }
    let rows: [Client] = try await client
      .from("clients")
      .select()
      .in("id", values: ids.map { $0.uuidString })
      .execute()
      .value
    return Dictionary(uniqueKeysWithValues: rows.map { ($0.id, $0) })
  }

  func allClients(businessId: UUID) async throws -> [Client] {
    try await client
      .from("clients")
      .select()
      .eq("business_id", value: businessId)
      .order("name", ascending: true)
      .execute()
      .value
  }

  // MARK: - Services

  func allServices(businessId: UUID) async throws -> [Service] {
    try await client
      .from("services")
      .select()
      .eq("business_id", value: businessId)
      .eq("active", value: true)
      .order("name", ascending: true)
      .execute()
      .value
  }

  // MARK: - Workers

  func allWorkers(businessId: UUID) async throws -> [Worker] {
    try await client
      .from("workers")
      .select()
      .eq("business_id", value: businessId)
      .order("name", ascending: true)
      .execute()
      .value
  }

  // MARK: - Booking updates

  func updateBookingStatus(id: UUID, status: BookingStatus, notes: String?) async throws {
    struct Patch: Encodable {
      let status: String
      let notes: String?
    }
    try await client
      .from("bookings")
      .update(Patch(status: status.rawValue, notes: notes))
      .eq("id", value: id)
      .execute()
  }

  func deleteBooking(id: UUID) async throws {
    try await client
      .from("bookings")
      .delete()
      .eq("id", value: id)
      .execute()
  }

  /// Створити нове бронювання + (якщо треба) нового клієнта в одній транзакції-like серії.
  func createBooking(
    businessId: UUID,
    existingClientId: UUID?,
    newClient: (name: String, phone: String?, address: String?)?,
    serviceId: UUID,
    workerIds: [UUID],
    startAt: Date,
    durationMin: Int,
    price: Double,
    notes: String?
  ) async throws {
    var clientId = existingClientId

    // 1. Якщо новий клієнт — створюємо
    if clientId == nil, let nc = newClient {
      struct NewClient: Encodable {
        let business_id: UUID
        let name: String
        let phone: String?
        let address: String?
      }
      struct ClientRow: Decodable { let id: UUID }
      let payload = NewClient(business_id: businessId, name: nc.name, phone: nc.phone, address: nc.address)
      let inserted: [ClientRow] = try await client
        .from("clients")
        .insert(payload)
        .select("id")
        .execute()
        .value
      clientId = inserted.first?.id
    }

    // 2. Створюємо booking
    struct NewBooking: Encodable {
      let business_id: UUID
      let client_id: UUID?
      let service_id: UUID
      let worker_ids: [String]
      let start_at: String
      let end_at: String
      let address: String?
      let price: Double
      let notes: String?
      let status: String
    }

    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    let endAt = Calendar.current.date(byAdding: .minute, value: durationMin, to: startAt) ?? startAt
    let address = newClient?.address  // якщо новий клієнт — беремо його адресу

    let booking = NewBooking(
      business_id: businessId,
      client_id: clientId,
      service_id: serviceId,
      worker_ids: workerIds.map { $0.uuidString },
      start_at: iso.string(from: startAt),
      end_at: iso.string(from: endAt),
      address: address,
      price: price,
      notes: notes,
      status: "scheduled"
    )

    try await client
      .from("bookings")
      .insert(booking)
      .execute()
  }

  // MARK: - Worker management (Manager only)

  func setWorkerIsManager(workerId: UUID, isManager: Bool) async throws {
    struct Patch: Encodable { let is_manager: Bool }
    try await client
      .from("workers")
      .update(Patch(is_manager: isManager))
      .eq("id", value: workerId)
      .execute()
  }
}

/// Зручна обгортка коли треба booking + serviceName разом.
struct BookingWithService: Identifiable, Hashable {
  let booking: Booking
  let serviceName: String?

  var id: UUID { booking.id }
}
