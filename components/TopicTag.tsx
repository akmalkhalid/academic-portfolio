// Self-contained type so this component has no dependency on lib/content.ts.
type Tag = { id: string; name: string; color: string; description?: string }

export function TopicTag({ tag, size = 'sm' }: { tag: Tag; size?: 'xs' | 'sm' }) {
  const cls = `tag-${tag.color || 'purple'}`
  const sizeCls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return <span className={`inline-block rounded-md font-medium ${cls} ${sizeCls}`}>{tag.name}</span>
}
