import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect legacy/singular path to the correct plural route
  redirect('/holdings')
}
