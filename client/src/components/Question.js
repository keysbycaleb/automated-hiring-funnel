import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Question({ question, index, isReordering, onEdit, onDelete }) {
  return (
    <Draggable
      key={question.id}
      draggableId={question.id}
      index={index}
      isDragDisabled={!isReordering}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(isReordering ? provided.dragHandleProps : {})}
          className={`bg-white p-6 rounded-large shadow-md flex items-center transition-shadow mb-4 ${snapshot.isDragging && 'shadow-2xl'} ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <div className={`text-gray-400 transition-all duration-300 ease-in-out ${isReordering ? 'w-10 opacity-100' : 'w-0 opacity-0'}`}>
            <Bars3Icon className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <p className="text-sm text-gray-500 capitalize">({question.type.replace('-', ' ')})</p>
            <p className="text-lg font-semibold text-gray-800">{question.question}</p>
          </div>
          <div className="space-x-2">
            <button onClick={onEdit} onMouseDown={(e) => e.stopPropagation()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-5 rounded-medium transition-colors duration-200">Edit</button>
            <button onClick={onDelete} onMouseDown={(e) => e.stopPropagation()} className="bg-transparent hover:bg-red-600 text-red-600 hover:text-white font-bold py-2 px-5 border border-red-600 rounded-medium transition-colors duration-200">Delete</button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
