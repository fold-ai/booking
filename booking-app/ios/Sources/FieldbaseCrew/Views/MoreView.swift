import SwiftUI

/// "More" вкладка — пункти що чекають на реалізацію в наступних етапах,
/// плюс Sign out.
struct MoreView: View {
  @Environment(AppState.self) private var state

  var body: some View {
    ZStack {
      Theme.ink50.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 20) {
          // Заголовок
          VStack(alignment: .leading, spacing: 4) {
            Text("More").font(.displayLarge).foregroundStyle(Theme.ink800)
            if let business = state.role?.business {
              Text(business.name).foregroundStyle(Theme.ink400)
            }
          }

          // Coming soon секція
          VStack(spacing: 0) {
            sectionHeader("Coming in next update")
            comingSoonRow(icon: "calendar", title: "Calendar", subtitle: "Week view with drag & drop")
            comingSoonRow(icon: "person.crop.circle", title: "Clients", subtitle: "Full client list, search, edit")
            comingSoonRow(icon: "wrench.and.screwdriver", title: "Services", subtitle: "Manage offerings and prices")
            comingSoonRow(icon: "megaphone", title: "Public profile", subtitle: "Edit how customers see you")
            comingSoonRow(icon: "gearshape", title: "Settings", subtitle: "Hours, branding, payment", last: true)
          }
          .background(.white)
          .clipShape(RoundedRectangle(cornerRadius: 16))
          .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.ink100))

          // Web link card
          if let business = state.role?.business {
            VStack(alignment: .leading, spacing: 8) {
              HStack {
                Image(systemName: "globe").foregroundStyle(Theme.amber)
                Text("Full admin on the web").font(.callout).fontWeight(.semibold)
              }
              Text("All features above are already available at drevito.com. Open your booking page or admin dashboard from any browser.")
                .font(.caption).foregroundStyle(Theme.ink400)
              Link(destination: URL(string: "https://drevito.com/book/\(business.slug)")!) {
                HStack(spacing: 4) {
                  Text("Open booking page").font(.caption).fontWeight(.medium)
                  Image(systemName: "arrow.up.right").font(.caption2)
                }
                .foregroundStyle(Theme.ink700)
              }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.amber.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 16))
          }

          // Account
          VStack(spacing: 0) {
            sectionHeader("Account")
            HStack {
              Image(systemName: "envelope").foregroundStyle(Theme.ink400).frame(width: 24)
              Text(state.user?.email ?? "—").foregroundStyle(Theme.ink800)
              Spacer()
            }
            .padding(14)
            Divider().padding(.leading, 14)
            Button {
              state.signOut()
            } label: {
              HStack {
                Image(systemName: "rectangle.portrait.and.arrow.right").foregroundStyle(.red).frame(width: 24)
                Text("Sign out").foregroundStyle(.red)
                Spacer()
              }
              .padding(14)
            }
          }
          .background(.white)
          .clipShape(RoundedRectangle(cornerRadius: 16))
          .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.ink100))
        }
        .padding(20)
      }
    }
  }

  private func sectionHeader(_ title: String) -> some View {
    HStack {
      Text(title.uppercased())
        .font(.caption2).tracking(1).foregroundStyle(Theme.ink400)
        .padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 6)
      Spacer()
    }
  }

  private func comingSoonRow(icon: String, title: String, subtitle: String, last: Bool = false) -> some View {
    VStack(spacing: 0) {
      HStack {
        Image(systemName: icon).foregroundStyle(Theme.ink400).frame(width: 24)
        VStack(alignment: .leading, spacing: 2) {
          Text(title).foregroundStyle(Theme.ink800)
          Text(subtitle).font(.caption).foregroundStyle(Theme.ink400)
        }
        Spacer()
        Text("Soon").font(.caption2).fontWeight(.semibold)
          .padding(.horizontal, 8).padding(.vertical, 3)
          .background(Theme.ink100)
          .foregroundStyle(Theme.ink600)
          .clipShape(Capsule())
      }
      .padding(14)
      if !last { Divider().padding(.leading, 14) }
    }
  }
}
