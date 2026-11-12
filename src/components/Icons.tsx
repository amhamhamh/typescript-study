import type { ComponentProps } from 'react';

type IconProps = ComponentProps<'svg'>;

function Svg(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
  );
}

export const CheckIcon = (props: IconProps) => <Svg {...props}><path d="M3 8.5l3.2 3.2L13 4.8" /></Svg>;
export const ArrowRight = (props: IconProps) => <Svg {...props}><path d="M3 8h10M9 4l4 4-4 4" /></Svg>;
export const ArrowLeft = (props: IconProps) => <Svg {...props}><path d="M13 8H3M7 4L3 8l4 4" /></Svg>;
export const MenuIcon = (props: IconProps) => <Svg {...props}><path d="M2 4h12M2 8h12M2 12h12" /></Svg>;
export const CloseIcon = (props: IconProps) => <Svg {...props}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></Svg>;
export const SunIcon = (props: IconProps) => (
  <Svg {...props}><circle cx="8" cy="8" r="2.75" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" /></Svg>
);
export const MoonIcon = (props: IconProps) => <Svg {...props}><path d="M13.5 9.5A5.75 5.75 0 016.5 2.5a5.75 5.75 0 107 7z" /></Svg>;
