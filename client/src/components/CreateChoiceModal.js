import React from 'react';
import { 
    ChatBubbleLeftEllipsisIcon, 
    ListBulletIcon, 
    QueueListIcon, 
    CheckCircleIcon,
    DocumentTextIcon, // New
    TableCellsIcon,   // New
    PencilSquareIcon, // New
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function CreateChoiceModal({ isOpen, onClose, onChoice, canCreateQuestion }) {
    if (!isOpen) return null;

    const questionTypes = [
        { type: 'short-text', label: 'Short Text', icon: ChatBubbleLeftEllipsisIcon, disabled: !canCreateQuestion },
        { type: 'long-text-ai', label: 'AI Scored Answer', icon: ListBulletIcon, disabled: !canCreateQuestion },
        { type: 'radio', label: 'Multiple Choice', icon: QueueListIcon, disabled: !canCreateQuestion },
        { type: "checkbox-group", label: "Checkbox Group", icon: CheckCircleIcon, disabled: !canCreateQuestion },
        { type: "description", label: "Description / Text Block", icon: DocumentTextIcon, disabled: !canCreateQuestion },
        { type: "matrix", label: "Matrix", icon: TableCellsIcon, disabled: !canCreateQuestion },
        { type: "signature-block", label: "Signature Block", icon: PencilSquareIcon, disabled: !canCreateQuestion },
    ];

    const handleChoice = (type) => {
        if (type === 'section' || canCreateQuestion) {
            onChoice(type);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-2xl bg-white">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">What would you like to create?</h3>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleChoice('section')}
                            className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-blue-100 hover:shadow-md rounded-lg transition-all"
                        >
                            <div className="bg-blue-100 p-3 rounded-full">
                                <ListBulletIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <span className="mt-4 font-semibold text-gray-800">New Section</span>
                        </button>

                        {questionTypes.map(({ type, label, icon: Icon, disabled }) => (
                            <button
                                key={type}
                                onClick={() => handleChoice(type)}
                                disabled={disabled}
                                className={`flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg transition-all ${
                                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100 hover:shadow-md'
                                }`}
                            >
                                <div className={`${disabled ? 'bg-gray-200' : 'bg-green-100'} p-3 rounded-full`}>
                                    <Icon className={`h-8 w-8 ${disabled ? 'text-gray-400' : 'text-green-600'}`} />
                                </div>
                                <span className="mt-4 font-semibold text-gray-800">{label}</span>
                            </button>
                        ))}
                    </div>
                    {!canCreateQuestion && (
                        <p className="mt-4 text-sm text-red-600">You must create a section before you can add questions.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
