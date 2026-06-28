// Public DS primitives surface. Other modules import from this barrel:
//
//   import { Button, Icon, Panel, ScrollArea } from '@shared/ds/primitives';
//
// More primitives are added JIT as features demand them. Keep them all
// re-exported from here so consumers never reach into individual folders.

export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';

export { ComingSoon } from './ComingSoon';

export { Icon } from './Icon';
export type { IconProps, IconSize, IconType, IconWeight } from './Icon';

export { Panel } from './Panel';
export type { PanelProps, PanelTone } from './Panel';

export { ScrollArea } from './ScrollArea';
export type { ScrollAreaProps } from './ScrollArea';

export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { Popover, PopoverContent, PopoverTrigger } from './Popover';
export type { PopoverContentProps, PopoverProps, PopoverTriggerProps } from './Popover';

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';
export type { DropdownMenuProps } from './DropdownMenu';

export { Badge } from './Badge';
export type { BadgeProps, BadgeSize, BadgeTone } from './Badge';

export { Spinner } from './Spinner';
export type { SpinnerProps, SpinnerSize } from './Spinner';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps, ProgressBarTone } from './ProgressBar';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { Input } from './Input';
export type { InputProps, InputSize } from './Input';

export { Select } from './Select';
export type { SelectOption, SelectProps } from './Select';

export { Slider } from './Slider';
export type { SliderProps } from './Slider';

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { ConfirmDialog } from './ConfirmDialog';
