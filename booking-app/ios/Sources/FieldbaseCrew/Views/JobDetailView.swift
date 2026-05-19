import SwiftUI
import MapKit

struct JobDetailView: View {
  let item: BookingWithService
  @Environment(AppState.self) private var state
  @Environment(\.dismiss) private var dismiss
  @State private var notes: String = ""
  @State private var confirmDelete = false

  private var booking: Booking { item.booking }
  private var client: Client? { booking.clientId.flatMap { state.clientsById[$0] } }
  private var isManager: Bool { state.role?.isManager == true }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        VStack(alignment: .leading, spacing: 6) {
          Text(timeRange).font(.caption).tracking(1).foregroundStyle(Theme.ink400)
          Text(client?.name ?? "Booking").font(.displayLarge).foregroundStyle(Theme.ink800)
          Text(item.serviceName ?? "Service").foregroundStyle(Theme.ink400)
        }

        HStack(spacing: 10) {
          actionButton(title: "Open in Maps", system: "map.fill") { openMaps() }
          if let phone = client?.phone, let url = URL(string: "tel:\(phone.filter { $0.isNumber })") {
            actionButton(title: "Call", system: "phone.fill") { UIApplication.shared.open(url) }
          }
        }

        infoCard
        statusPicker
        notesCard

        if isManager {
          Button(role: .destructive) {
            confirmDelete = true
          } label: {
            HStack {
              Image(systemName: "trash")
              Text("Delete booking").fontWeight(.medium)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 12)
            .background(Color.red.opacity(0.1)).foregroundStyle(.red).clipShape(Capsule())
          }
        }
      }
      .padding(20)
    }
    .background(Theme.ink50.ignoresSafeArea())
    .navigationBarTitleDisplayMode(.inline)
    .onAppear { notes = booking.notes ?? "" }
    .alert("Delete booking?", isPresented: $confirmDelete) {
      Button("Cancel", role: .cancel) {}
      Button("Delete", role: .destructive) {
        Task {
          await state.deleteBooking(item)
          dismiss()
        }
      }
    } message: {
      Text("This will permanently remove the booking. The client won't be notified.")
    }
  }

  private var infoCard: some View {
    VStack(alignment: .leading, spacing: 12) {
      row(label: "Address", value: booking.address.isEmpty ? "—" : booking.address)
      if let phone = client?.phone {
        row(label: "Phone", value: phone)
      }
      row(label: "Price", value: String(format: "$%.0f", booking.price))
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(.white)
    .clipShape(RoundedRectangle(cornerRadius: 16))
    .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.ink100))
  }

  private var statusPicker: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("STATUS").font(.caption).tracking(1).foregroundStyle(Theme.ink400)
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 8) {
          ForEach(BookingStatus.allCases, id: \.self) { s in
            Button {
              Task { await state.setStatus(item, status: s, notes: notes) }
            } label: {
              Text(s.label)
                .font(.callout).fontWeight(.medium)
                .padding(.horizontal, 12).padding(.vertical, 8)
                .background(booking.status == s ? Theme.ink800 : Color.white)
                .foregroundStyle(booking.status == s ? Theme.ink50 : Theme.ink600)
                .clipShape(Capsule())
                .overlay(Capsule().strokeBorder(Theme.ink100))
            }
          }
        }
      }
    }
  }

  private var notesCard: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("NOTES").font(.caption).tracking(1).foregroundStyle(Theme.ink400)
      TextEditor(text: $notes)
        .frame(minHeight: 120)
        .padding(8)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Theme.ink100))
      Button {
        Task { await state.setStatus(item, status: booking.status, notes: notes) }
      } label: {
        Text("Save note").frame(maxWidth: .infinity).padding(.vertical, 12)
          .background(Theme.amber).foregroundStyle(Theme.ink800).clipShape(Capsule())
      }
    }
  }

  private func row(label: String, value: String) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(label.uppercased()).font(.caption2).tracking(1).foregroundStyle(Theme.ink400)
      Text(value).foregroundStyle(Theme.ink700)
    }
  }

  private func actionButton(title: String, system: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      HStack {
        Image(systemName: system)
        Text(title).fontWeight(.medium)
      }
      .frame(maxWidth: .infinity).padding(.vertical, 12)
      .background(Theme.ink800).foregroundStyle(Theme.ink50)
      .clipShape(Capsule())
    }
  }

  private func openMaps() {
    let q = booking.address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    if let url = URL(string: "http://maps.apple.com/?q=\(q)") {
      UIApplication.shared.open(url)
    }
  }

  private var timeRange: String {
    let f = DateFormatter(); f.dateFormat = "h:mm a"
    return "\(f.string(from: booking.start)) – \(f.string(from: booking.end))"
  }
}
