import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, Circle, Lock } from 'lucide-react';

interface LessonProgressProps {
  level: string;
  topic: string;
  progress: number;
  completed: string[];
  onSelectTopic: (level: string, topic: string) => void;
  curriculum: {
    [key: string]: {
      topics: string[];
      requiredToAdvance: number;
    };
  };
}

const LessonProgress: React.FC<LessonProgressProps> = ({
  level,
  topic,
  progress,
  completed,
  onSelectTopic,
  curriculum
}) => {
  // Helper function to format topic names for display
  const formatTopicName = (topic: string) => {
    return topic
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to check if a topic is available
  const isTopicAvailable = (checkLevel: string, checkTopic: string) => {
    // Current level topics are available
    if (checkLevel === level) {
      return true;
    }
    
    // Previous level topics are always available
    if (
      (level === 'intermediate' && checkLevel === 'beginner') ||
      (level === 'advanced' && (checkLevel === 'beginner' || checkLevel === 'intermediate'))
    ) {
      return true;
    }
    
    // Next level topics are only available if enough topics are completed in current level
    if (
      (level === 'beginner' && checkLevel === 'intermediate') ||
      (level === 'intermediate' && checkLevel === 'advanced')
    ) {
      const completedInCurrentLevel = curriculum[level].topics.filter(t => 
        completed.includes(`${level}-${t}`)
      ).length;
      
      return completedInCurrentLevel >= curriculum[level].requiredToAdvance;
    }
    
    return false;
  };

  // Helper function to get the status of a topic
  const getTopicStatus = (checkLevel: string, checkTopic: string) => {
    const topicKey = `${checkLevel}-${checkTopic}`;
    
    if (completed.includes(topicKey)) {
      return 'completed';
    }
    
    if (checkLevel === level && checkTopic === topic) {
      return 'current';
    }
    
    if (isTopicAvailable(checkLevel, checkTopic)) {
      return 'available';
    }
    
    return 'locked';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Learning Journey</CardTitle>
        <CardDescription>
          Track your progress through the curriculum
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress in current topic */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">
            Current Lesson: {formatTopicName(topic)}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <Badge variant={level === 'beginner' ? 'default' : level === 'intermediate' ? 'secondary' : 'destructive'}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground ml-2">
              {progress + 1}/5 lessons completed
            </span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${(progress / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Level sections */}
        {Object.keys(curriculum).map((currLevel) => (
          <div key={currLevel} className="mb-6">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Badge variant={currLevel === 'beginner' ? 'default' : currLevel === 'intermediate' ? 'secondary' : 'destructive'} className="mr-2">
                {currLevel.charAt(0).toUpperCase() + currLevel.slice(1)}
              </Badge>
              {!isTopicAvailable(currLevel, curriculum[currLevel].topics[0]) && (
                <Lock className="h-4 w-4 ml-2 text-muted-foreground" />
              )}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {curriculum[currLevel].topics.map((currTopic) => {
                const status = getTopicStatus(currLevel, currTopic);
                
                return (
                  <Button
                    key={currTopic}
                    variant={status === 'current' ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start ${status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => status !== 'locked' && onSelectTopic(currLevel, currTopic)}
                    disabled={status === 'locked'}
                  >
                    {status === 'completed' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                    {status === 'current' && <Circle className="h-4 w-4 mr-2 text-primary fill-primary" />}
                    {status === 'available' && <Circle className="h-4 w-4 mr-2 text-muted-foreground" />}
                    {status === 'locked' && <Lock className="h-4 w-4 mr-2 text-muted-foreground" />}
                    <span className="truncate">{formatTopicName(currTopic)}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LessonProgress; 