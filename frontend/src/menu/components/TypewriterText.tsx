import { useEffect, useRef } from 'react'
import Typed from 'typed.js'

interface Props {
  text: string
  className?: string
  typeSpeed?: number
  backSpeed?: number
  backDelay?: number
}

export default function TypewriterText({ text, className, typeSpeed = 45, backSpeed = 28, backDelay = 2800 }: Props) {
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!el.current || !text) return

    const typed = new Typed(el.current, {
      strings: [text],
      typeSpeed,
      backSpeed,
      backDelay,
      startDelay: 300,
      showCursor: true,
      cursorChar: '|',
      loop: true,
    })

    return () => typed.destroy()
  }, [text, typeSpeed, backSpeed, backDelay])

  // Wrapper block keeps the typed.js cursor span inside this element,
  // not as a sibling flex item in the parent flex-col container.
  return (
    <p className={className}>
      <span ref={el} />
    </p>
  )
}
