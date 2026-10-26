// Inline stroke icons (24×24, currentColor) so the app has no icon dependency.
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const make = (paths) => (props) => <svg {...base} {...props}>{paths}</svg>;

export const HomeIcon = make(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>);
export const SparkIcon = make(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 8.5 13.6 10.4 15.5 12l-1.9 1.6L12 15.5l-1.6-1.9L8.5 12l1.9-1.6Z" /></>);
export const GridIcon = make(<><rect x="3" y="3" width="7.5" height="9" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="5" rx="1.5" /><rect x="3" y="15" width="7.5" height="6" rx="1.5" /><rect x="13.5" y="11" width="7.5" height="10" rx="1.5" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
export const HeartIcon = make(<path d="M12 20s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />);
export const ShareIcon = make(<><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></>);
export const LinkIcon = make(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
export const RemixIcon = make(<><path d="M4 7h11l-3-3M20 17H9l3 3" /><path d="M20 7v2M4 17v-2" /></>);
export const PlayIcon = make(<path d="M7 4.5v15l12-7.5Z" fill="currentColor" stroke="none" />);
export const EyeIcon = make(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>);
export const DownloadIcon = make(<><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M4 20h16" /></>);
export const TrashIcon = make(<><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" /></>);
export const GlobeIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>);
export const LockIcon = make(<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>);
export const SearchIcon = make(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const DiceIcon = make(<><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" /><circle cx="9" cy="15" r="1" fill="currentColor" /></>);
export const CoinIcon = make(<><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></>);
export const ChevronIcon = make(<path d="m6 9 6 6 6-6" />);
export const VolumeIcon = make(<><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>);
export const MuteIcon = make(<><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="m16 10 4 4M20 10l-4 4" /></>);
export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
