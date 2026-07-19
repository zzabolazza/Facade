interface CountryFlagIconProps {
  code: string
  src: string
  className?: string
}

export function CountryFlagIcon({ code, src, className = 'h-4 w-4' }: CountryFlagIconProps) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      data-country-code={code}
      draggable={false}
      onError={(event) => { event.currentTarget.hidden = true }}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  )
}
