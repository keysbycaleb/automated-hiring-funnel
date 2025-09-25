import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function QuestionModal({ isOpen, onClose, onSave, item: editingItem, context, sections }) {
    // --- Existing State ---
    const [question, setQuestion] = useState('');
    const [type, setType] = useState('radio');
    const [options, setOptions] = useState([]);
    const [scoringRubric, setScoringRubric] = useState([]);
    const [rubricInput, setRubricInput] = useState('');
    const [points, setPoints] = useState(10);
    const [sectionId, setSectionId] = useState('');
    const [title, setTitle] = useState('');

    // --- ADDED: State for new question types ---
    const [description, setDescription] = useState('');
    const [agreementText, setAgreementText] = useState('');
    const [checkboxLabel, setCheckboxLabel] = useState('');
    const [rows, setRows] = useState(['']);
    const [columns, setColumns] = useState([{ label: '', points: 0 }]);

    const isSectionMode = context?.type === 'section';

    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                if (isSectionMode) {
                    setTitle(editingItem.title || '');
                } else {
                    setQuestion(editingItem.question || '');
                    setType(editingItem.type || 'radio');
                    setOptions(editingItem.options || []);
                    setScoringRubric(Array.isArray(editingItem.scoringRubric) ? editingItem.scoringRubric : []);
                    setPoints(editingItem.points || 10);
                    setSectionId(editingItem.sectionId || '');
                    // --- ADDED: Populate new state for editing ---
                    setDescription(editingItem.description || '');
                    setAgreementText(editingItem.agreementText || '');
                    setCheckboxLabel(editingItem.checkboxLabel || '');
                    setRows(editingItem.rows || ['']);
                    setColumns(editingItem.columns || [{ label: '', points: 0 }]);
                }
            } else {
                // Reset form for new item
                setTitle('');
                setQuestion('');
                setType(context.type || 'radio'); // Set type from context for new questions
                setOptions([]);
                setScoringRubric([]);
                setRubricInput('');
                setPoints(10);
                setSectionId(context.sectionId || (sections && sections.length > 0 ? sections[0].id : ''));
                // --- ADDED: Reset new state for new items ---
                setDescription('');
                setAgreementText('');
                setCheckboxLabel('');
                setRows(['']);
                setColumns([{ label: '', points: 0 }]);
            }
        }
    }, [isOpen, editingItem, context, isSectionMode, sections]);

    const handleSave = () => {
        if (isSectionMode) {
            onSave({ title });
            return;
        }

        const questionData = {
            question,
            type,
            sectionId,
        };

        if (type === 'radio' || type === 'checkbox-group') {
            questionData.options = options;
        } else if (type === 'long-text-ai') {
            questionData.scoringRubric = scoringRubric;
            questionData.points = points;
        }
        // --- ADDED: Save logic for new question types ---
        else if (type === 'description') {
            questionData.description = description;
        } else if (type === 'signature-block') {
            questionData.agreementText = agreementText;
            questionData.checkboxLabel = checkboxLabel;
        } else if (type === 'matrix') {
            questionData.rows = rows;
            questionData.columns = columns;
        }

        onSave(questionData);
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        if (field === 'points') {
            value = parseInt(value, 10) || 0;
        }
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { value: '', points: 0 }]);
    };

    const removeOption = (index) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleRubricInputChange = (e) => {
        setRubricInput(e.target.value.replace(/\s/g, ''));
    };

    const handleRubricKeyDown = (e) => {
        if (e.key === 'Enter' && rubricInput.trim() !== '') {
            e.preventDefault();
            const newRubric = rubricInput.trim();
            if (scoringRubric.length < 10 && !scoringRubric.includes(newRubric)) {
                setScoringRubric([...scoringRubric, newRubric]);
                setRubricInput('');
            }
        }
    };

    const removeRubricItem = (index) => {
        setScoringRubric(scoringRubric.filter((_, i) => i !== index));
    };

    // --- ADDED: Handlers for Matrix editing ---
    const handleMatrixChange = (type, index, value) => {
        if (type === 'rows') {
            const newRows = [...rows];
            newRows[index] = value;
            setRows(newRows);
        } else if (type === 'columns') {
            const newColumns = [...columns];
            newColumns[index].label = value;
            setColumns(newColumns);
        }
    };

    const handleMatrixPointsChange = (colIndex, pointsValue) => {
        const newColumns = [...columns];
        newColumns[colIndex].points = parseInt(pointsValue, 10) || 0;
        setColumns(newColumns);
    };

    const addMatrixField = (type) => {
        if (type === 'rows') {
            setRows([...rows, '']);
        } else {
            setColumns([...columns, { label: '', points: 0 }]);
        }
    };

    const removeMatrixField = (type, index) => {
        if (type === 'rows') {
            setRows(rows.filter((_, i) => i !== index));
        } else {
            setColumns(columns.filter((_, i) => i !== index));
        }
    };


    if (!isOpen) return null;

    const getModalTitle = () => {
        if (isSectionMode) {
            return editingItem ? 'Edit Section Title' : 'Create New Section';
        }
        return editingItem ? 'Edit Question' : 'Create New Question';
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-large shadow-2xl p-8 w-full max-w-2xl transform transition-all overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{getModalTitle()}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {isSectionMode ? (
                    <div>
                        <label htmlFor="sectionTitle" className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                        <input
                            id="sectionTitle"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="e.g., Contact Information"
                        />
                    </div>
                ) : (
                    <>
                        {!editingItem && sections.length > 1 && (
                            <div className="mb-6">
                                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                                <select id="section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                   {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
                            <input id="question" type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full p-3 border border-gray-300 rounded-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., What is your greatest strength?"/>
                        </div>
                        <div className="mt-6">
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                            <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 border border-gray-300 rounded-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                <option value="radio">Multiple Choice</option>
                                <option value="checkbox-group">Checkboxes</option>
                                <option value="long-text-ai">Long Answer (AI Scored)</option>
                                {/* --- ADDED: New question type options --- */}
                                <option value="description">Description / Text Block</option>
                                <option value="matrix">Matrix</option>
                                <option value="signature-block">Signature Block</option>
                            </select>
                        </div>

                        {/* --- ADDED: Form for Description type --- */}
                        {type === 'description' && (
                            <div className="mt-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description Text</label>
                                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full p-3 border border-gray-300 rounded-medium" placeholder="Enter the text you want to display to the applicant."></textarea>
                            </div>
                        )}

                        {/* --- ADDED: Form for Signature Block type --- */}
                        {type === 'signature-block' && (
                             <div className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="agreementText" className="block text-sm font-medium text-gray-700 mb-2">Agreement Text</label>
                                    <textarea id="agreementText" value={agreementText} onChange={(e) => setAgreementText(e.target.value)} rows="4" className="w-full p-3 border border-gray-300 rounded-medium" placeholder="Enter the certification text..."></textarea>
                                </div>
                                <div>
                                    <label htmlFor="checkboxLabel" className="block text-sm font-medium text-gray-700 mb-2">Checkbox Label</label>
                                    <input id="checkboxLabel" type="text" value={checkboxLabel} onChange={(e) => setCheckboxLabel(e.target.value)} className="w-full p-3 border border-gray-300 rounded-medium" placeholder="e.g., I agree to the terms."/>
                                </div>
                             </div>
                        )}
                        
                        {/* --- ADDED: Form for Matrix type --- */}
                        {type === 'matrix' && (
                            <div className="mt-6 space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-3">Rows</h3>
                                    {rows.map((row, index) => (
                                        <div key={index} className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-md">
                                            <input type="text" placeholder="Row label" value={row} onChange={(e) => handleMatrixChange('rows', index, e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-medium"/>
                                            <button onClick={() => removeMatrixField('rows', index)} className="p-2 text-red-500 hover:text-red-700"><XMarkIcon className="h-5 w-5"/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addMatrixField('rows')} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold">Add Row</button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-3">Columns</h3>
                                    {columns.map((col, index) => (
                                        <div key={index} className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-md">
                                            <input type="text" placeholder="Column label" value={col.label} onChange={(e) => handleMatrixChange('columns', index, e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-medium"/>
                                            <input type="number" placeholder="Points" value={col.points} onChange={(e) => handleMatrixPointsChange(index, e.target.value)} className="w-24 p-2 border border-gray-300 rounded-medium"/>
                                            <button onClick={() => removeMatrixField('columns', index)} className="p-2 text-red-500 hover:text-red-700"><XMarkIcon className="h-5 w-5"/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addMatrixField('columns')} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold">Add Column</button>
                                </div>
                            </div>
                        )}

                        {(type === 'radio' || type === 'checkbox-group') && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-gray-800 mb-3">Options</h3>
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-md">
                                        <input type="text" placeholder="Option value" value={option.value} onChange={(e) => handleOptionChange(index, 'value', e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-medium" />
                                        <input type="number" placeholder="Points" value={option.points} onChange={(e) => handleOptionChange(index, 'points', e.target.value)} className="w-24 p-2 border border-gray-300 rounded-medium" />
                                        <button onClick={() => removeOption(index)} className="p-2 text-red-500 hover:text-red-700"><XMarkIcon className="h-5 w-5"/></button>
                                    </div>
                                ))}
                                <button onClick={addOption} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold">Add Option</button>
                            </div>
                        )}
                        
                        {type === 'long-text-ai' && (
                            <>
                                <div className="mt-6">
                                    <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                                    <input id="points" type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value, 10))} className="w-full p-3 border border-gray-300 rounded-medium" placeholder="e.g., 10" />
                                </div>
                                <div className="mt-6">
                                    <label htmlFor="scoringRubric" className="block text-sm font-medium text-gray-700 mb-2">AI Scoring Rubric</label>
                                    <p className="text-xs text-gray-500 mb-2">Enter a keyword and press "Enter". Max 10 keywords. Spaces are not allowed.</p>
                                    <input id="scoringRubric" type="text" value={rubricInput} onChange={handleRubricInputChange} onKeyDown={handleRubricKeyDown} className="w-full p-3 border border-gray-300 rounded-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder={scoringRubric.length < 10 ? "Add a keyword..." : "Maximum keywords reached"} disabled={scoringRubric.length >= 10} />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {scoringRubric.map((item, index) => (
                                            <div key={index} className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center">
                                                {item}
                                                <button onClick={() => removeRubricItem(index)} className="ml-2 text-gray-600 hover:text-gray-800 font-bold text-sm leading-none">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 text-right mt-2">{10 - scoringRubric.length} remaining</p>
                                </div>
                            </>
                        )}
                    </>
                )}

                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-medium transition-colors">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-medium transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
}

