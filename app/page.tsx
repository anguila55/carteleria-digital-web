import AuthenticationForm from '@/Shared/Components/Auth/AuthenticationForm'
import OfflineAuthRedirect from '@/Shared/Components/Auth/OfflineAuthRedirect'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <OfflineAuthRedirect />
      <AuthenticationForm />
    </main>
  )
}
