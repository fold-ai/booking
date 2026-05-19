import Foundation
import Supabase

/// Доступ до даних через Supabase Postgres + RLS.
struct SupabaseService {
  private var client: SupabaseClient { SupabaseClientProvider.shared }

  // MARK: - Worker

  func workerForUser(userId: UUID) async throws -> Worker? {
    let rows: [Worker] = try await client
      .from("workers")
      .select()
      .eq("user_id", value: userId)
      .limit(1)
      .execute()
      .value
    return rows.first
  }

  // MARK: - Bookings

  /// Сьогоднішні bookings де worker згаданий у `worker_ids`.
  /// Долучаємо назву сервіса окремим запитом (Postgres array containment).
  func todayBookings(workerId: UUID) async throws -> [BookingWithService] {
    let cal = Calendar.current
    let start = cal.startOfDay(for: Date())
    let end = cal.date(byAdding: .day, value: 1, to: start) ?? start

    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    let bookings: [Booking] = try await client
      .from("bookings")
      .select()
      .contains("worker_ids", value: [workerId.uuidString])
      .gte("start_at", value: iso.string(from: start))
      .lt("start_at",  value: iso.string(from: end))
      .order("start_at", ascending: true)
      .execute()
      .value

    // Один запит у services для всіх потрібних serviceId
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
      BookingWithService(
        booking: b,
        serviceName: b.serviceId.flatMap { nameById[$0] }
      )
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

  // MARK: - Updates

  func updateBooking(id: UUID, status: BookingStatus, notes: String?) async throws {
    struct Patch: Encodable {
      let status: String
      let notes: String?
    }
    let patch = Patch(status: status.rawValue, notes: notes)
    try await client
      .from("bookings")
      .update(patch)
      .eq("id", value: id)
      .execute()
  }
}

/// Зручна обгортка коли треба booking + serviceName разом.
struct BookingWithService: Identifiable, Hashable {
  let booking: Booking
  let serviceName: String?

  var id: UUID { booking.id }
}
