import { getSiteConfig } from '@/lib/content'
import PostgraduateClient from './PostgraduateClient'

export default function Page() {
  const cfg = getSiteConfig()
  return <PostgraduateClient email={cfg.email} />
}
