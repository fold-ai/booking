import SeoLanding from '../../components/SeoLanding.jsx'

export default function SchedulingAppForFieldServiceTeams() {
  return (
    <SeoLanding
      seo={{
        title: 'Scheduling App for Field Service Teams (Web + iOS) | Drevito',
        description:
          'Drevito is a scheduling app for field service teams — a shared calendar, a crew app for the field, client history, and revenue tracking for owners. Web and iOS. Free trial.',
        path: '/scheduling-app-for-field-service-teams',
      }}
      eyebrow="Scheduling app for teams"
      h1="A scheduling app that keeps your whole field service team in sync"
      lede="One shared calendar for the office, a focused job list for the crew. Drevito works on the web for owners and managers and on iOS for the people in the truck — everyone sees the right thing at the right time."
      bullets={[
        'Shared calendar across the whole team',
        'iOS crew app for jobs on the go',
        'Roles: owners, managers, crew',
        'Revenue & tips visible to owners only',
      ]}
      sections={[
        {
          h2: 'The office and the field, finally on the same page',
          paragraphs: [
            'When schedules live in someone’s head or a group chat, jobs slip. Drevito puts every booking on a calendar your whole team shares in real time. Reassign a job to a different crew member and it updates everywhere instantly — no “did you get my text?”',
            'Managers and owners plan the week from the web dashboard. Crew members open the iOS app and see only their jobs for the day: who, where, what service, and any notes. They can call the customer, get directions, mark a job in-progress or done, and add tips — all from their phone.',
          ],
          list: [
            'Real-time shared calendar, color-coded by crew',
            'Invite workers by email; assign manager rights',
            'Crew see their route; office sees everything',
            'Status updates and notes sync back instantly',
          ],
        },
        {
          h2: 'Roles and permissions that match how a team actually works',
          paragraphs: [
            'Not everyone should see the money. Drevito separates owners and managers from regular crew: financials like prices, tips, and weekly earnings are visible only to owners and managers, while crew get a clean, money-free view of their work.',
            'As your team grows, invitations make onboarding painless — send a worker a join link, they sign in, and they’re on the schedule. Promote a trusted lead to manager when you’re ready to delegate the calendar.',
          ],
        },
      ]}
      faqs={[
        {
          q: 'Is there a mobile app for my crew?',
          a: 'Yes. Crew members use the Drevito iOS app to see their assigned jobs, get directions, update job status, and log tips. Owners and managers can use the web dashboard or the app.',
        },
        {
          q: 'Can I control who sees revenue?',
          a: 'Revenue, tips, and earnings are restricted to owners and managers. Regular crew members never see pricing or financial totals.',
        },
        {
          q: 'How do I add my team?',
          a: 'Invite each worker by email from the Crew screen. They sign in with that email and are automatically linked to your business and schedule.',
        },
      ]}
    />
  )
}
