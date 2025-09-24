import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, writeBatch, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { DragDropContext } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext'; // ADDED: Import useAuth
import QuestionModal from '../components/QuestionModal';
import ConfirmModal from '../components/ConfirmModal';
import CreateChoiceModal from '../components/CreateChoiceModal';
import AlertModal from '../components/AlertModal';
import Section from '../components/Section';
import { PencilIcon, ChevronDownIcon, RectangleGroupIcon, DocumentPlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useReordering } from '../context/ReorderingContext';
import emptyStateImage from '../assets/empty-state.png';

export default function QuestionnaireBuilder() {
  const { currentUser } = useAuth(); // ADDED: Get the current user
  const { setIsReordering: setAppReordering } = useReordering();
  const [sections, setSections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalContext, setModalContext] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false });
  const [alertModalState, setAlertModalState] = useState({ isOpen: false });
  const [isReordering, setIsReordering] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const dropdownRef = useRef(null);
  const questionsContainerRef = useRef(null);
  const headerRef = useRef(null);

  // ADDED: Helper function for creating user-specific collection paths
  const getCollectionPath = (col) => `users/${currentUser.uid}/${col}`;

  const saveOrder = useCallback(async () => {
    // MODIFIED: Added check for currentUser and uses user-specific paths
    if (isReordering && currentUser) {
        const batch = writeBatch(db);
        sections.forEach((section, sectionIndex) => {
            const sectionRef = doc(db, getCollectionPath('sections'), section.id);
            batch.update(sectionRef, { order: sectionIndex });
            section.questions.forEach((question, questionIndex) => {
                const docRef = doc(db, getCollectionPath('questionnaire'), question.id);
                batch.update(docRef, { order: questionIndex, sectionId: section.id });
            });
        });
        await batch.commit();
        setIsReordering(false);
    }
  }, [isReordering, sections, currentUser]);

  useEffect(() => {
    setAppReordering(isReordering);
  }, [isReordering, setAppReordering]);

  // MODIFIED: Wrapped in useCallback and made user-specific
  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const sectionsQuery = query(collection(db, getCollectionPath('sections')), orderBy('order', 'asc'));
    const questionsQuery = query(collection(db, getCollectionPath('questionnaire')), orderBy('order', 'asc'));
    
    const [sectionsSnapshot, questionsSnapshot] = await Promise.all([getDocs(sectionsQuery), getDocs(questionsQuery)]);
    
    const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), questions: [] }));
    const questionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const sectionsMap = new Map(sectionsData.map(s => [s.id, s]));
    questionsData.forEach(q => {
        if (q.sectionId && sectionsMap.has(q.sectionId)) {
            sectionsMap.get(q.sectionId).questions.push(q);
        }
    });

    setSections(Array.from(sectionsMap.values()));
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canReorder = sections.length > 1 || sections.flatMap(s => s.questions).length > 1;

  useEffect(() => {
    const handleDropdownClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleReorderClickOutside = (event) => {
      if (
        isReordering &&
        questionsContainerRef.current && !questionsContainerRef.current.contains(event.target) &&
        headerRef.current && !headerRef.current.contains(event.target)
      ) {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50');
        let clickInModal = false;
        modals.forEach(modal => {
          if (modal.contains(event.target)) {
            clickInModal = true;
          }
        });

        if (!clickInModal) {
          saveOrder();
        }
      }
    };
    
    const handleKeyDown = (event) => {
      if (isModalOpen || confirmModalState.isOpen || isChoiceModalOpen || alertModalState.isOpen || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        return;
      }
      if (event.key === 'r' && canReorder && !isReordering) {
        event.preventDefault();
        setIsReordering(true);
      }
    };

    document.addEventListener("mousedown", handleDropdownClickOutside);
    document.addEventListener("mousedown", handleReorderClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    if (isReordering) {
      document.body.classList.add('select-none');
    } else {
      document.body.classList.remove('select-none');
    }

    return () => {
      document.removeEventListener("mousedown", handleDropdownClickOutside);
      document.removeEventListener("mousedown", handleReorderClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove('select-none');
    };
  }, [isReordering, isModalOpen, confirmModalState.isOpen, isChoiceModalOpen, alertModalState.isOpen, sections, canReorder, saveOrder]);

  const handleOpenModal = async (item = null, context = {}) => {
    if (isReordering) {
      await saveOrder();
    }
    if (context.type === 'question' && !item) {
      setActiveSectionId(context.sectionId);
    }
    setEditingItem(item);
    setModalContext(context);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setModalContext({});
    setIsModalOpen(false);
    setActiveSectionId(null);
  };

  const handleCreateChoice = (choice) => {
    setIsChoiceModalOpen(false);
    handleOpenModal(null, { type: choice });
  };

  const showAlert = (title, message) => {
    setAlertModalState({ isOpen: true, title, message });
  };

  const handleSaveItem = async (itemData) => {
    // MODIFIED: Added check for currentUser and uses user-specific paths
    if (!currentUser) return;
    if (modalContext.type === 'section') {
      if (!itemData.title || itemData.title.trim() === '') {
        showAlert("Title Required", "Section title cannot be empty. Please enter a title to create the section.");
        return; 
      }
      if (editingItem && editingItem.id) {
        await updateDoc(doc(db, getCollectionPath('sections'), editingItem.id), itemData);
      } else {
        const newOrder = sections.length;
        await addDoc(collection(db, getCollectionPath('sections')), { ...itemData, order: newOrder });
      }
    } else {
      if (!itemData.question || itemData.question.trim() === '') {
        showAlert("Question Required", "Question text cannot be empty. Please enter a question.");
        return;
      }
      if (editingItem && editingItem.id) {
        await updateDoc(doc(db, getCollectionPath('questionnaire'), editingItem.id), itemData);
      } else {
        const questionsCollection = collection(db, getCollectionPath('questionnaire'));
        const sectionId = itemData.sectionId || (sections.length > 0 ? sections[0].id : null);
        if (!sectionId) {
            console.error("Cannot create a question without a section.");
            showAlert("Error", "An error occurred. A question must belong to a section.");
            return;
        }
        const newOrder = sections.find(s => s.id === sectionId)?.questions.length || 0;
        await addDoc(questionsCollection, { ...itemData, order: newOrder, sectionId });
      }
    }
    await fetchData();
    handleCloseModal();
  };
  
  const handleDeleteRequest = (item, type) => {
    let title = 'Delete Item';
    let message = 'Are you sure you want to delete this item? This action cannot be undone.';
    let onConfirm;

    if (type === 'section') {
        title = 'Delete Section';
        message = 'Are you sure you want to delete this section and all the questions within it? This action cannot be undone.';
        onConfirm = () => handleDeleteConfirm(item, type);
    } else {
        title = 'Delete Question';
        onConfirm = () => handleDeleteConfirm(item, type);
    }

    setConfirmModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleDeleteConfirm = async (itemOrId, type) => {
    // MODIFIED: Added check for currentUser and uses user-specific paths
    if (!currentUser) return;
    if (type === 'section') {
        const batch = writeBatch(db);
        itemOrId.questions.forEach(q => {
            const questionDoc = doc(db, getCollectionPath('questionnaire'), q.id);
            batch.delete(questionDoc);
        });
        const sectionDoc = doc(db, getCollectionPath('sections'), itemOrId.id);
        batch.delete(sectionDoc);
        await batch.commit();
    } else {
        await deleteDoc(doc(db, getCollectionPath('questionnaire'), itemOrId));
    }
    
    await fetchData();
    setConfirmModalState({ isOpen: false });
  };
  
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
  
    const sourceSectionId = source.droppableId;
    const destSectionId = destination.droppableId;
  
    let newSections = JSON.parse(JSON.stringify(sections));
    const sourceSection = newSections.find(s => s.id === sourceSectionId);
    const destSection = newSections.find(s => s.id === destSectionId);
  
    const [removed] = sourceSection.questions.splice(source.index, 1);
  
    if (sourceSectionId === destSectionId) {
      sourceSection.questions.splice(destination.index, 0, removed);
    } else {
      removed.sectionId = destSectionId;
      destSection.questions.splice(destination.index, 0, removed);
    }
  
    setSections(newSections);
  };

  const aiQuestionCount = sections.flatMap(s => s.questions).filter(q => q.type === 'long-text-ai').length;

  return (
    <div className="p-8">
      <div ref={headerRef} className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Questionnaire Builder</h1>
        <div className="flex items-center space-x-4">
          <Link to="/questionnaire/preview" target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-2xl transition-colors duration-200 flex items-center shadow-sm border border-gray-300">
              <EyeIcon className="h-5 w-5 mr-2" />
              Preview
          </Link>
          {canReorder && (
            isReordering ? (
              <button onClick={saveOrder} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl transition-colors duration-200">
                Done
              </button>
            ) : (
              <button type="button" onClick={() => setIsReordering(true)} className="text-gray-600 hover:text-gray-900 font-bold py-3 px-4 rounded-2xl transition-colors duration-200">
                Reorder
              </button>
            )
          )}
          <div className="relative" ref={dropdownRef}>
            <div className="flex rounded-2xl shadow-sm border border-gray-300">
              <button 
                onClick={() => setIsChoiceModalOpen(true)}
                className="bg-white hover:bg-gray-100 text-gray-700 font-bold py-3 pl-6 pr-4 rounded-l-2xl transition-colors duration-200 flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Create
              </button>
              <div className="border-l border-gray-300"></div>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white hover:bg-gray-100 text-gray-700 font-bold py-3 px-3 rounded-r-2xl transition-colors duration-200"
              >
                <ChevronDownIcon className="h-5 w-5" />
              </button>
            </div>
            {isDropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleOpenModal(null, { type: 'section' }); }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                        <RectangleGroupIcon className="h-5 w-5 mr-3" />
                        Add New Section
                    </a>
                    <a href="#" 
                        onClick={(e) => { 
                            e.preventDefault(); 
                            if (sections.length > 0) handleOpenModal(null, { type: 'question', sectionId: sections[0].id });
                        }}
                        className={`text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${sections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <DocumentPlusIcon className="h-5 w-5 mr-3" />
                        Add New Question
                    </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {aiQuestionCount >= 7 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-2xl mb-6" role="alert">
          <p className="font-bold">API Usage Alert</p>
          <p>You have used {aiQuestionCount} of your 10 available AI-scored questions. You have {10 - aiQuestionCount} remaining.</p>
        </div>
      )}
      
      {loading ? (
        <p>Loading...</p>
      ) : sections.length === 0 ? (
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 250px)' }}>
            <div className="text-center p-10 bg-white rounded-[25px] shadow-lg border border-gray-200 w-full max-w-3xl">
                <img src={emptyStateImage} alt="Empty questionnaire" className="mx-auto mb-8 h-48" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Looks like there's nothing here.</h2>
                <p className="text-gray-600 mb-6">
                    <button
                        onClick={() => handleOpenModal(null, { type: 'section' })}
                        className="text-blue-600 hover:underline font-semibold"
                    >
                        Click here
                    </button>
                    {' '}to create your first section.
                </p>
            </div>
        </div>
      ) : (
        <div ref={questionsContainerRef}>
            <DragDropContext onDragEnd={onDragEnd}>
                {sections.map(section => (
                    <Section 
                        key={section.id} 
                        section={section}
                        isReordering={isReordering}
                        activeSectionId={activeSectionId}
                        onEditQuestion={(q) => handleOpenModal(q, { type: 'question' })}
                        onDeleteQuestion={(id) => handleDeleteRequest(id, 'question')}
                        onEditSection={(s) => handleOpenModal(s, { type: 'section' })}
                        onDeleteSection={(s) => handleDeleteRequest(s, 'section')}
                        onAddQuestion={(sectionId) => handleOpenModal(null, { type: 'question', sectionId })}
                    />
                ))}
            </DragDropContext>
        </div>
      )}

      <CreateChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        onChoice={handleCreateChoice}
        canCreateQuestion={sections.length > 0}
      />

      <QuestionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveItem}
        item={editingItem}
        context={modalContext}
        sections={sections}
      />
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false })}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
      >
        {confirmModalState.message}
      </ConfirmModal>
      <AlertModal
        isOpen={alertModalState.isOpen}
        onClose={() => setAlertModalState({ isOpen: false })}
        title={alertModalState.title}
      >
        {alertModalState.message}
      </AlertModal>
    </div>
  );
}
