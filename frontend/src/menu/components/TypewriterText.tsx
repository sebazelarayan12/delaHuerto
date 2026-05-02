import { useEffect, useRef } from 'react'
import Typed from 'typed.js'

interface Props {
  text: string
  className?: string
  typeSpeed?: number
}

export default function TypewriterText({ text, className, typeSpeed = 45 }: Props) {
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!el.current || !text) return

    const typed = new Typed(el.current, {
      strings: [text],
      typeSpeed,
      showCursor: true,
      cursorChar: '|',
      loop: false,
    })

    return () => typed.destroy()
  }, [text, typeSpeed])

  return <span ref={el} className={className} />
}
