import type { NormalizedComponent, NormalizedInfrastructureRequirement } from '../types/estimate.types.js';

export class ClarifyingQuestionService {
  process(requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement {
    return {
      ...requirement,
      clarifyingQuestions: this.questions(requirement.components)
    };
  }

  questions(components: NormalizedComponent[]): string[] {
    const questions: string[] = [];

    if (components.some((component) => component.type === 'database' && component.missingFields.includes('highAvailability'))) {
      questions.push('Should PostgreSQL be highly available?');
    }

    if (components.some((component) => component.type === 'cache' && component.missingFields.includes('tier'))) {
      questions.push('Should Redis be basic/dev or production-grade?');
    }

    if (components.some((component) => component.type === 'load_balancer' && component.missingFields.includes('scheme'))) {
      questions.push('Is the load balancer HTTP/S or TCP?');
    }

    return questions;
  }
}
