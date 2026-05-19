import SwiftUI

/// Sheet для створення нового booking. Доступно тільки в Manager mode.
struct NewBookingSheet: View {
  @Environment(AppState.self) private var state
  @Environment(\.dismiss) private var dismiss

  // Client
  @State private var existingClientId: UUID?
  @State private var newClientName = ""
  @State private var newClientPhone = ""
  @State private var newClientAddress = ""
  @State private var allClients: [Client] = []

  // Service
  @State private var serviceId: UUID?

  // Time
  @State private var startAt: Date = Calendar.current.date(
    bySettingHour: 9, minute: 0, second: 0, of: Date()
  ) ?? Date()

  // Workers
  @State private var selectedWorkerIds: Set<UUID> = []

  // Notes
  @State private var notes = ""

  // State
  @State private var saving = false
  @State private var errorMsg: String?

  private var selectedService: Service? {
    state.services.first(where: { $0.id == serviceId })
  }

  private var canSave: Bool {
    let hasClient = existingClientId != nil || !newClientName.trimmingCharacters(in: .whitespaces).isEmpty
    return hasClient && serviceId != nil && !saving
  }

  var body: some View {
    NavigationStack {
      Form {
        Section {
          Picker("Client", selection: $existingClientId) {
            Text("— New client —").tag(UUID?.none)
            ForEach(allClients) { c in
              Text(c.name).tag(UUID?.some(c.id))
            }
          }
          if existingClientId == nil {
            TextField("Name", text: $newClientName)
            TextField("Phone", text: $newClientPhone)
              .keyboardType(.phonePad)
            TextField("Address", text: $newClientAddress)
          }
        } header: {
          Text("Client")
        }

        Section {
          Picker("Service", selection: $serviceId) {
            Text("— Choose —").tag(UUID?.none)
            ForEach(state.services) { s in
              Text("\(s.name) — $\(Int(s.basePrice))").tag(UUID?.some(s.id))
            }
          }
          if let svc = selectedService {
            HStack {
              Text("Duration").foregroundStyle(Theme.ink400)
              Spacer()
              Text("\(svc.durationMin) min").foregroundStyle(Theme.ink700)
            }
            HStack {
              Text("Price").foregroundStyle(Theme.ink400)
              Spacer()
              Text(String(format: "$%.0f", svc.basePrice)).foregroundStyle(Theme.ink700)
            }
          }
        } header: {
          Text("Service")
        }

        Section {
          DatePicker("Start", selection: $startAt, displayedComponents: [.date, .hourAndMinute])
        } header: {
          Text("Time")
        }

        Section {
          if state.workers.isEmpty {
            Text("No workers yet. Add some on the web.")
              .foregroundStyle(Theme.ink400)
              .font(.callout)
          } else {
            ForEach(state.workers) { w in
              Button {
                if selectedWorkerIds.contains(w.id) {
                  selectedWorkerIds.remove(w.id)
                } else {
                  selectedWorkerIds.insert(w.id)
                }
              } label: {
                HStack {
                  Image(systemName: selectedWorkerIds.contains(w.id) ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selectedWorkerIds.contains(w.id) ? Theme.amber : Theme.ink400)
                  Text(w.name).foregroundStyle(Theme.ink800)
                  if w.isManager {
                    Text("MANAGER")
                      .font(.caption2).fontWeight(.bold)
                      .padding(.horizontal, 6).padding(.vertical, 2)
                      .background(Theme.amber.opacity(0.2))
                      .foregroundStyle(Theme.ink700)
                      .clipShape(Capsule())
                  }
                  Spacer()
                }
              }
              .buttonStyle(.plain)
            }
          }
        } header: {
          Text("Assigned workers")
        }

        Section {
          TextField("Notes (optional)", text: $notes, axis: .vertical)
            .lineLimit(3...6)
        } header: {
          Text("Notes")
        }

        if let err = errorMsg {
          Section {
            Text(err).foregroundStyle(.red).font(.callout)
          }
        }
      }
      .navigationTitle("New booking")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button(saving ? "Creating…" : "Create") {
            Task { await save() }
          }
          .disabled(!canSave)
          .fontWeight(.semibold)
        }
      }
      .task { await loadClients() }
    }
  }

  private func loadClients() async {
    guard let business = state.role?.business else { return }
    let service = SupabaseService()
    do {
      let clients = try await service.allClients(businessId: business.id)
      await MainActor.run { self.allClients = clients }
    } catch {
      // Тихо: список клієнтів не критичний, можна створити нового
    }
  }

  private func save() async {
    guard let svc = selectedService else { return }
    saving = true; errorMsg = nil
    defer { saving = false }

    let newClient: (name: String, phone: String?, address: String?)? = existingClientId == nil
      ? (
          name: newClientName.trimmingCharacters(in: .whitespaces),
          phone: newClientPhone.isEmpty ? nil : newClientPhone,
          address: newClientAddress.isEmpty ? nil : newClientAddress
        )
      : nil

    let ok = await state.createBooking(
      existingClientId: existingClientId,
      newClient: newClient,
      serviceId: svc.id,
      workerIds: Array(selectedWorkerIds),
      startAt: startAt,
      durationMin: svc.durationMin,
      price: svc.basePrice,
      notes: notes.isEmpty ? nil : notes
    )

    if ok {
      dismiss()
    } else {
      errorMsg = state.errorMessage ?? "Could not create booking."
    }
  }
}
