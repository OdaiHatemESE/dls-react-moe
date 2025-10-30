import React from 'react';
import {
  SquaresFour as Dashboard,
  ChatCircleDots as Messages,
  MegaphoneSimple as Announcements,
  CalendarBlank as Calendar,
  User as Profile,
  ChartBar as Summary,
  Bell,
  CaretDown,
  List as Menu,
  X as XMark,
  CheckCircle as Attendance,
  Notebook as Grades,
  ClipboardText as Assignments,
  Gear as Settings,
  DownloadSimple as Download,
  UploadSimple as Export,
  PencilSimple as Edit,
  FunnelSimple as Filter,
  MagnifyingGlass as Search,
  Plus,
  Check,
  Warning as Alert,
  House as Home,
  CaretRight as ChevronRight,
  SpinnerGap as Spinner
} from '@phosphor-icons/react'
// switched to official phosphor react package name

type IconProps = React.ComponentProps<typeof Dashboard>

export const DashboardIcon = (props: IconProps) => <Dashboard {...props} />
export const SummaryIcon = (props: IconProps) => <Summary {...props} />
export const MessagesIcon = (props: IconProps) => <Messages {...props} />
export const AnnouncementsIcon = (props: IconProps) => <Announcements {...props} />
export const CalendarIcon = (props: IconProps) => <Calendar {...props} />
export const ProfileIcon = (props: IconProps) => <Profile {...props} />
export const BellIcon = (props: IconProps) => <Bell {...props} />
export const ChevronDownIcon = (props: IconProps) => <CaretDown {...props} />
export const MenuIcon = (props: IconProps) => <Menu {...props} />
export const XIcon = (props: IconProps) => <XMark {...props} />
export const AttendanceIcon = (props: IconProps) => <Attendance {...props} />
export const GradesIcon = (props: IconProps) => <Grades {...props} />
export const AssignmentsIcon = (props: IconProps) => <Assignments {...props} />
export const SettingsIcon = (props: IconProps) => <Settings {...props} />
export const DownloadIcon = (props: IconProps) => <Download {...props} />
export const ExportIcon = (props: IconProps) => <Export {...props} />
export const EditIcon = (props: IconProps) => <Edit {...props} />
export const FilterIcon = (props: IconProps) => <Filter {...props} />
export const SearchIcon = (props: IconProps) => <Search {...props} />
export const PlusIcon = (props: IconProps) => <Plus {...props} />
export const CheckIcon = (props: IconProps) => <Check {...props} />
export const AlertIcon = (props: IconProps) => <Alert {...props} />
export const HomeIcon = (props: IconProps) => <Home {...props} />
export const ChevronRightIcon = (props: IconProps) => <ChevronRight {...props} />
export const LoadingIcon = (props: IconProps) => <Spinner className="animate-spin" {...props} />