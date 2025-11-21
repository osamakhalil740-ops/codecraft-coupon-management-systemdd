import React from 'react';
import {
    // Navigation & UI
    HomeIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    ChartBarIcon,
    BellIcon,
    MagnifyingGlassIcon,
    
    // Business & Commerce
    BuildingStorefrontIcon,
    TagIcon,
    TicketIcon,
    CreditCardIcon,
    BanknotesIcon,
    ShoppingBagIcon,
    
    // User & Account
    UserIcon,
    UserCircleIcon,
    UsersIcon,
    UserPlusIcon,
    IdentificationIcon,
    KeyIcon,
    
    // Actions & Controls
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    
    // Status & Feedback
    CheckIcon,
    CheckCircleIcon,
    XMarkIcon,
    XCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    
    // Data & Analytics
    TableCellsIcon,
    PresentationChartBarIcon,
    PresentationChartLineIcon,
    CircleStackIcon,
    DocumentChartBarIcon,
    
    // Communication
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    PhoneIcon,
    LinkIcon,
    ShareIcon,
    
    // Time & Calendar
    CalendarDaysIcon,
    ClockIcon,
    
    // Media & Content
    PhotoIcon,
    DocumentIcon,
    FolderIcon,
    CloudArrowUpIcon,
    
    // System & Settings
    CommandLineIcon,
    ServerIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    WifiIcon,
    
    // Misc
    GiftIcon,
    SparklesIcon,
    FireIcon,
    LightBulbIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Filled versions for active states
import {
    HomeIcon as HomeSolidIcon,
    UserCircleIcon as UserCircleSolidIcon,
    CheckCircleIcon as CheckCircleSolidIcon,
    ExclamationCircleIcon as ExclamationCircleSolidIcon,
    InformationCircleIcon as InformationCircleSolidIcon
} from '@heroicons/react/24/solid';

// Icon size variants
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray';

interface IconProps {
    size?: IconSize;
    color?: IconColor;
    className?: string;
    solid?: boolean;
}

const getIconSizeClasses = (size: IconSize) => {
    const sizes = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4', 
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8'
    };
    return sizes[size];
};

const getIconColorClasses = (color: IconColor) => {
    const colors = {
        primary: 'text-blue-600',
        secondary: 'text-purple-600',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        info: 'text-blue-500',
        gray: 'text-gray-600'
    };
    return colors[color];
};

// Standardized Icon Component
interface StandardIconProps extends IconProps {
    icon: React.ComponentType<any>;
}

export const StandardIcon: React.FC<StandardIconProps> = ({ 
    icon: IconComponent, 
    size = 'md', 
    color = 'gray', 
    className = '',
    ...props 
}) => {
    const sizeClasses = getIconSizeClasses(size);
    const colorClasses = getIconColorClasses(color);
    
    return (
        <IconComponent 
            className={`${sizeClasses} ${colorClasses} ${className}`} 
            {...props}
        />
    );
};

// Predefined Icon Collections
export const NavigationIcons = {
    Home: (props: IconProps) => <StandardIcon icon={props.solid ? HomeSolidIcon : HomeIcon} {...props} />,
    Settings: (props: IconProps) => <StandardIcon icon={Cog6ToothIcon} {...props} />,
    Users: (props: IconProps) => <StandardIcon icon={UserGroupIcon} {...props} />,
    Analytics: (props: IconProps) => <StandardIcon icon={ChartBarIcon} {...props} />,
    Notifications: (props: IconProps) => <StandardIcon icon={BellIcon} {...props} />,
    Search: (props: IconProps) => <StandardIcon icon={MagnifyingGlassIcon} {...props} />
};

export const BusinessIcons = {
    Shop: (props: IconProps) => <StandardIcon icon={BuildingStorefrontIcon} {...props} />,
    Tag: (props: IconProps) => <StandardIcon icon={TagIcon} {...props} />,
    Ticket: (props: IconProps) => <StandardIcon icon={TicketIcon} {...props} />,
    Credit: (props: IconProps) => <StandardIcon icon={CreditCardIcon} {...props} />,
    Money: (props: IconProps) => <StandardIcon icon={BanknotesIcon} {...props} />,
    Shopping: (props: IconProps) => <StandardIcon icon={ShoppingBagIcon} {...props} />
};

export const UserIcons = {
    User: (props: IconProps) => <StandardIcon icon={UserIcon} {...props} />,
    UserCircle: (props: IconProps) => <StandardIcon icon={props.solid ? UserCircleSolidIcon : UserCircleIcon} {...props} />,
    Users: (props: IconProps) => <StandardIcon icon={UsersIcon} {...props} />,
    UserPlus: (props: IconProps) => <StandardIcon icon={UserPlusIcon} {...props} />,
    Profile: (props: IconProps) => <StandardIcon icon={IdentificationIcon} {...props} />,
    Key: (props: IconProps) => <StandardIcon icon={KeyIcon} {...props} />
};

export const ActionIcons = {
    Plus: (props: IconProps) => <StandardIcon icon={PlusIcon} {...props} />,
    Edit: (props: IconProps) => <StandardIcon icon={PencilIcon} {...props} />,
    Delete: (props: IconProps) => <StandardIcon icon={TrashIcon} {...props} />,
    View: (props: IconProps) => <StandardIcon icon={EyeIcon} {...props} />,
    Hide: (props: IconProps) => <StandardIcon icon={EyeSlashIcon} {...props} />,
    ArrowRight: (props: IconProps) => <StandardIcon icon={ArrowRightIcon} {...props} />,
    ArrowLeft: (props: IconProps) => <StandardIcon icon={ArrowLeftIcon} {...props} />,
    ChevronRight: (props: IconProps) => <StandardIcon icon={ChevronRightIcon} {...props} />,
    ChevronDown: (props: IconProps) => <StandardIcon icon={ChevronDownIcon} {...props} />
};

export const StatusIcons = {
    Check: (props: IconProps) => <StandardIcon icon={CheckIcon} {...props} />,
    CheckCircle: (props: IconProps) => <StandardIcon icon={props.solid ? CheckCircleSolidIcon : CheckCircleIcon} {...props} />,
    Close: (props: IconProps) => <StandardIcon icon={XMarkIcon} {...props} />,
    Error: (props: IconProps) => <StandardIcon icon={XCircleIcon} {...props} />,
    Warning: (props: IconProps) => <StandardIcon icon={props.solid ? ExclamationCircleSolidIcon : ExclamationCircleIcon} {...props} />,
    Alert: (props: IconProps) => <StandardIcon icon={ExclamationTriangleIcon} {...props} />,
    Info: (props: IconProps) => <StandardIcon icon={props.solid ? InformationCircleSolidIcon : InformationCircleIcon} {...props} />
};

export const DataIcons = {
    Table: (props: IconProps) => <StandardIcon icon={TableCellsIcon} {...props} />,
    BarChart: (props: IconProps) => <StandardIcon icon={PresentationChartBarIcon} {...props} />,
    LineChart: (props: IconProps) => <StandardIcon icon={PresentationChartLineIcon} {...props} />,
    Database: (props: IconProps) => <StandardIcon icon={CircleStackIcon} {...props} />,
    Report: (props: IconProps) => <StandardIcon icon={DocumentChartBarIcon} {...props} />
};

export const CommunicationIcons = {
    Chat: (props: IconProps) => <StandardIcon icon={ChatBubbleLeftRightIcon} {...props} />,
    Email: (props: IconProps) => <StandardIcon icon={EnvelopeIcon} {...props} />,
    Phone: (props: IconProps) => <StandardIcon icon={PhoneIcon} {...props} />,
    Link: (props: IconProps) => <StandardIcon icon={LinkIcon} {...props} />,
    Share: (props: IconProps) => <StandardIcon icon={ShareIcon} {...props} />
};

export const TimeIcons = {
    Calendar: (props: IconProps) => <StandardIcon icon={CalendarDaysIcon} {...props} />,
    Clock: (props: IconProps) => <StandardIcon icon={ClockIcon} {...props} />
};

export const SystemIcons = {
    Terminal: (props: IconProps) => <StandardIcon icon={CommandLineIcon} {...props} />,
    Server: (props: IconProps) => <StandardIcon icon={ServerIcon} {...props} />,
    Shield: (props: IconProps) => <StandardIcon icon={ShieldCheckIcon} {...props} />,
    Lock: (props: IconProps) => <StandardIcon icon={LockClosedIcon} {...props} />,
    Wifi: (props: IconProps) => <StandardIcon icon={WifiIcon} {...props} />
};

export const SpecialIcons = {
    Gift: (props: IconProps) => <StandardIcon icon={GiftIcon} {...props} />,
    Sparkles: (props: IconProps) => <StandardIcon icon={SparklesIcon} {...props} />,
    Fire: (props: IconProps) => <StandardIcon icon={FireIcon} {...props} />,
    Idea: (props: IconProps) => <StandardIcon icon={LightBulbIcon} {...props} />,
    Rocket: (props: IconProps) => <StandardIcon icon={RocketLaunchIcon} {...props} />
};

// All icons in one export for convenience
export const Icons = {
    ...NavigationIcons,
    ...BusinessIcons,
    ...UserIcons,
    ...ActionIcons,
    ...StatusIcons,
    ...DataIcons,
    ...CommunicationIcons,
    ...TimeIcons,
    ...SystemIcons,
    ...SpecialIcons
};

export default Icons;