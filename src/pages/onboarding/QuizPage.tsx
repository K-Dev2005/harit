import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IconWalk, 
  IconBus, 
  IconCar, 
  IconHome,
  IconLeaf,
  IconSalad,
  IconFish,
  IconMeat,
  IconSolarPanel,
  IconPlug,
  IconFlame,
  IconWood,
  IconCircleX,
  IconPlane,
  IconPlaneTilt,
  IconWorld
} from '@tabler/icons-react';

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface Option {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const questions: Question[] = [
  {
    id: 'commute',
    text: 'How do you usually get to work or college?',
    options: [
      { id: 'walk', label: 'Walk or cycle', icon: <IconWalk size={24} /> },
      { id: 'public', label: 'Public transport', icon: <IconBus size={24} /> },
      { id: 'car', label: 'Personal car or bike', icon: <IconCar size={24} /> },
      { id: 'wfh', label: 'Work from home', icon: <IconHome size={24} /> }
    ]
  },
  {
    id: 'diet',
    text: 'What best describes your diet?',
    options: [
      { id: 'vegan', label: 'Vegan', icon: <IconLeaf size={24} /> },
      { id: 'veg', label: 'Vegetarian', icon: <IconSalad size={24} /> },
      { id: 'meat_some', label: 'Meat a few times a week', icon: <IconFish size={24} /> },
      { id: 'meat_daily', label: 'Meat every day', icon: <IconMeat size={24} /> }
    ]
  },
  {
    id: 'home',
    text: 'How is your home mainly powered?',
    options: [
      { id: 'solar', label: 'Solar or renewables', icon: <IconSolarPanel size={24} /> },
      { id: 'grid', label: 'Grid electricity', icon: <IconPlug size={24} /> },
      { id: 'lpg', label: 'LPG / gas cylinder', icon: <IconFlame size={24} /> },
      { id: 'biomass', label: 'Biomass / firewood', icon: <IconWood size={24} /> }
    ]
  },
  {
    id: 'flights',
    text: 'How many flights did you take last year?',
    options: [
      { id: 'none', label: 'None', icon: <IconCircleX size={24} /> },
      { id: 'one_two', label: '1–2 short trips', icon: <IconPlane size={24} /> },
      { id: 'three_five', label: '3–5 flights', icon: <IconPlaneTilt size={24} /> },
      { id: 'six_plus', label: '6 or more', icon: <IconWorld size={24} /> }
    ]
  }
];

export default function QuizPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = questions[currentStep];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    
    const newAnswers = { ...answers, [question.id]: optionId };
    setAnswers(newAnswers);
    
    // Auto advance
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
        setSelectedOption(null);
      } else {
        localStorage.setItem('harit_quiz_answers', JSON.stringify(newAnswers));
        navigate('/result');
      }
    }, 300);
  };

  return (
    <div className="flex flex-col h-screen bg-background p-lg max-w-[600px] mx-auto">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-md mb-xl">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-[36px] font-semibold leading-[1.2] tracking-[-0.02em] text-on-surface mb-xl text-center">
          {question.text}
        </h2>

        <div className="flex flex-col gap-sm">
          {question.options.map(option => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`
                  flex items-center gap-md p-lg rounded-lg border text-left transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary-container/10 ring-1 ring-primary' 
                    : 'border-outline-variant bg-surface hover:bg-surface-container-lowest hover:border-outline'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center p-sm rounded-md
                  ${isSelected ? 'text-primary bg-primary-container/20' : 'text-on-surface-variant bg-surface-container'}
                `}>
                  {option.icon}
                </div>
                <span className={`text-[18px] leading-[28px] ${isSelected ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
