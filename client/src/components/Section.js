import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Question from './Question';
import { RectangleGroupIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function Section({ section, isReordering, activeSectionId, onEditQuestion, onDeleteQuestion, onEditSection, onDeleteSection, onAddQuestion }) {
  const isSectionActive = section.id === activeSectionId;

  return (
    <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
            <RectangleGroupIcon className="h-6 w-6 mr-3 text-gray-500" />
            <h2 className="text-2xl font-bold text-gray-700">{section.title}</h2>
        </div>
        <div className="space-x-2">
            <button onClick={() => onAddQuestion(section.id)} className="text-gray-500 hover:text-blue-600 font-bold py-2 px-4 rounded-2xl transition-colors duration-200 flex items-center">
                <PlusCircleIcon className="h-5 w-5 mr-2"/> Add Question
            </button>
            <button onClick={() => onEditSection(section)} className="text-gray-500 hover:text-gray-800 font-bold py-2 px-4 rounded-2xl transition-colors duration-200">
                <PencilIcon className="h-5 w-5"/>
            </button>
            <button onClick={() => onDeleteSection(section)} className="text-gray-500 hover:text-red-600 font-bold py-2 px-4 rounded-2xl transition-colors duration-200">
                <TrashIcon className="h-5 w-5"/>
            </button>
        </div>
      </div>
      
      <Droppable droppableId={section.id} type="QUESTION">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] rounded-2xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
          >
            {section.questions.map((q, index) => (
              <Question
                key={q.id}
                question={q}
                index={index}
                isReordering={isReordering}
                onEdit={() => onEditQuestion(q)}
                onDelete={() => onDeleteQuestion(q.id)}
              />
            ))}
            {provided.placeholder}
            {section.questions.length === 0 && !snapshot.isDraggingOver && (
                 <button 
                    onClick={() => onAddQuestion(section.id)}
                    className={`w-full text-center py-10 px-6 bg-white rounded-2xl border-2 border-dashed transition-all duration-200 focus:outline-none ${isSectionActive ? 'border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}
                >
                    <h3 className="text-lg font-medium text-gray-600">This section is empty.</h3>
                    <p className="text-gray-500 mt-1">Click to add a question.</p>
                </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
