import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const templates = [
  {
    id: "fast-food-crew-complete",
    name: "Fast Food Crew Member (Complete)",
    description: "A comprehensive application designed for high-volume restaurants. Covers all aspects from personal info to detailed behavioral scenarios.",
    sections: [
      {
        title: "Application for Employment",
        order: 0,
        questions: [
          {
            question: "Application Introduction", // A title for the builder
            type: "description", // The new description type
            description: "Thank you for your interest in joining the team! This application is our first step in getting to know you. We've designed it to understand your work style, your approach to teamwork, and how you handle the day-to-day situations that arise in our restaurants. Please answer each question thoughtfully.",
            order: 0,
          },
        ],
      },
      {
        title: "Section 1: Personal Information",
        order: 1,
        questions: [
          { question: "Full Name", type: "short-text", order: 0, required: true },
          { question: "Phone Number", type: "short-text", order: 1, required: true },
          { question: "Email Address", type: "short-text", order: 2, required: true },
          {
            question: "Are you 16 years of age or older?",
            type: "radio",
            order: 3,
            required: true,
            options: [{ value: "Yes", points: 5 }, { value: "No", points: 0 }],
          },
          { question: "Resume/CV Upload (Optional)", type: "file-upload", order: 4 },
        ],
      },
      {
        title: "Section 2: Position & Logistics",
        order: 2,
        questions: [
          {
            question: "What position are you most interested in? (Check all that apply)",
            type: "checkbox-group", order: 0, required: true,
            options: [
              { value: "Crew Member (Front Counter/Drive-Thru)", points: 5 },
              { value: "Crew Member (Kitchen/Cook)", points: 5 },
              { value: "McCafé Barista", points: 5 },
              { value: "I'm flexible and open to any available position where the team needs me most.", points: 10 },
            ],
          },
          {
            question: "What is your ideal start date?",
            type: "radio", order: 1, required: true,
            options: [
              { value: "I am available to start immediately.", points: 10 },
              { value: "Within one week.", points: 5 },
              { value: "In 2-3 weeks.", points: 2 },
              { value: "I have a specific start date more than 3 weeks away", points: 0 },
            ],
          },
          {
            question: "How will you reliably commute to this location for every scheduled shift?",
            type: "radio", order: 2, required: true,
            options: [
              { value: "I have my own reliable personal vehicle.", points: 10 },
              { value: "I will use a reliable ride-share service (e.g., Uber, Lyft).", points: 5 },
              { value: "I will use reliable public transportation.", points: 5 },
              { value: "I will be getting a ride from someone else.", points: 2 },
            ],
          },
          {
            question: "Please indicate your weekly availability. (Check all that apply)",
            type: "matrix", // The new matrix type
            order: 3,
            required: true,
            rows: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            columns: [
                { label: "Morning (5am-12pm)", points: 2 },
                { label: "Afternoon (12pm-5pm)", points: 2 },
                { label: "Evening (5pm-11pm)", points: 3 },
                { label: "Late Night (11pm-5am)", points: 1 },
            ]
          },
        ],
      },
      {
          title: "Section 3: Work Style & Priorities",
          order: 3,
          questions: [
            {
                question: "When working on a team, which role feels most natural to you?",
                type: "radio", order: 0, required: true,
                options: [
                    { value: "The Helper: I instinctively look for teammates who are busy or struggling and jump in to help them catch up.", points: 10 },
                    { value: "The Specialist: I prefer to focus entirely on my assigned station to ensure my specific tasks are done perfectly and quickly.", points: 5 },
                    { value: "The Organizer: I like to make sure everyone is on the same page and knows the plan, especially during a complex order.", points: 7 },
                    { value: "The Motivator: I try to keep the mood light and the team's energy positive, especially during a tough rush.", points: 3 },
                ]
            },
            {
                question: "During a lunch rush, a manager tells the team to focus. In your opinion, how should the following priorities be ranked from most important (1) to least important (4)?",
                type: "ranking",
                order: 1, required: true,
                options: [ "Order Accuracy", "Speed of Service", "Friendly Attitude", "Suggestive Selling" ]
            },
            {
                question: "A customer asks for an item that is complicated and not on the menu. What is your immediate response?",
                type: "radio", order: 2, required: true,
                options: [
                    { value: "Let me check with my manager to see if that's something we can do for you.", points: 10 },
                    { value: "That's a great question. While we can't make that exact item, we can make you [suggest similar, simple menu item].", points: 8 },
                    { value: "I'm sorry, we can only make items that are on the menu.", points: 5 },
                    { value: "I think I can figure out how to make that for you, let me try.", points: 2 },
                ]
            }
          ]
      },
      {
        title: "Section 4: Scenarios & Mindset",
        order: 4,
        questions: [
            // This section remains the same, so it's omitted for brevity in this view,
            // but the full data is in the file.
            { question: "Beyond a paycheck, what do you hope to gain from working here?", type: "long-text-ai", order: 0, required: true, points: 15, scoringRubric: ["Ambition", "Goal-Orientation", "Coachability", "Brand Alignment", "Maturity", "Curiosity", "Professional Development", "Long-Term Perspective"] },
            { question: "Describe a time a process or rule seemed inefficient to you. How did you handle your observation?", type: "long-text-ai", order: 1, required: true, points: 15, scoringRubric: ["Integrity", "Judgment", "Problem-Solving", "Respect for Authority", "Diplomacy", "Process Adherence", "Critical Thinking", "Communication"] },
            { question: "It's the peak of the lunch rush. You see a teammate is overwhelmed and making mistakes. What is your immediate thought and what action do you take?", type: "long-text-ai", order: 2, required: true, points: 25, scoringRubric: ["Teamwork", "Initiative", "Situational Awareness", "Empathy", "Proactivity", "Communication", "Problem-Solving", "Composure"] },
            { question: "Consistency is key. How would you ensure you provide the same high-quality work on a slow Tuesday morning as you would during a chaotic Friday night?", type: "long-text-ai", order: 3, required: true, points: 20, scoringRubric: ["Reliability", "Consistency", "Discipline", "Attention to Detail", "Professionalism", "Work Ethic", "Quality Focus", "Accountability"] },
            { question: "Tell us about a time you received constructive criticism from a manager or teacher. How did you react in the moment and what did you do afterward?", type: "long-text-ai", order: 4, required: true, points: 20, scoringRubric: ["Coachability", "Humility", "Self-Awareness", "Resilience", "Maturity", "Adaptability", "Proactive Improvement", "Emotional Regulation"] },
            { question: "A customer is visibly upset because their order is incorrect. Provide the specific steps you would take to resolve the situation, starting from your first interaction with them.", type: "long-text-ai", order: 5, required: true, points: 25, scoringRubric: ["Problem-Solving", "Customer Focus", "Empathy", "Communication", "De-escalation", "Accountability", "Efficiency", "Composure"] },
            { question: "During a slow period, all your assigned duties are complete. What do you do with your time?", type: "long-text-ai", order: 6, required: true, points: 15, scoringRubric: ["Initiative", "Proactivity", "Work Ethic", "Ownership", "Resourcefulness", "Situational Awareness", "Efficiency", "Attention to Detail"] },
            { question: "Describe a specific time you had to learn a new skill quickly to complete a task or project. How did you approach the learning process?", type: "long-text-ai", order: 7, required: true, points: 15, scoringRubric: ["Adaptability", "Resourcefulness", "Problem-Solving", "Initiative", "Learning Agility", "Resilience", "Process-Oriented Thinking", "Efficiency"] },
            { question: "Everyone has a learning curve. What part of a fast-paced crew member job do you anticipate will be the most challenging for you, and what is your plan to master it?", type: "long-text-ai", order: 8, required: true, points: 15, scoringRubric: ["Self-Awareness", "Humility", "Teachability", "Honesty", "Foresight", "Proactivity", "Problem-Solving", "Growth Mindset"] },
            { question: "In your view, what is the single most important action an employee can take to ensure a customer leaves happy?", type: "long-text-ai", order: 9, required: true, points: 20, scoringRubric: ["Brand Alignment", "Customer Focus", "Strategic Thinking", "Prioritization", "Empathy", "Efficiency", "Quality Focus", "Accountability"] },
        ]
      },
      {
        title: "Section 5: Confirmation",
        order: 5,
        questions: [
          {
            question: "Confirmation Agreement", // Title for the builder
            type: "signature-block", // The new signature block type
            agreementText: "By signing below, I certify that all information provided in this application is true and complete to the best of my knowledge. I understand that any false information or omission may lead to the rejection of my application or, if I am hired, to disciplinary action up to and including termination.",
            checkboxLabel: "I agree to the terms and conditions.",
            order: 0,
            required: true,
          },
        ],
      },
    ],
  },
];

export const seedTemplatesToFirestore = async () => {
  const batch = writeBatch(db);
  const templatesCollection = collection(db, 'questionTemplates');

  templates.forEach(template => {
    const templateDocRef = doc(templatesCollection, template.id);
    const { sections, ...templateData } = template;
    batch.set(templateDocRef, templateData);

    const sectionsCollectionRef = collection(templateDocRef, 'sections');
    sections.forEach((section, sectionIndex) => {
        const sectionDocRef = doc(sectionsCollectionRef);
        const { questions, ...sectionData } = section;
        batch.set(sectionDocRef, { ...sectionData, order: sectionIndex });

        const questionsCollectionRef = collection(sectionDocRef, 'questions');
        questions.forEach((question, questionIndex) => {
            const questionDocRef = doc(questionsCollectionRef);
            batch.set(questionDocRef, { ...question, order: questionIndex });
        });
    });
  });

  try {
    await batch.commit();
    alert('Successfully seeded the new Fast Food Crew Member template!');
  } catch (error) {
    console.error("Error seeding templates: ", error);
    alert('Error seeding templates. Check the console.');
  }
};

