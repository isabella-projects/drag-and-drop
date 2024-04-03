import * as Decorators from '../inc/decorators';
import * as Functions from '../inc/functions';
import * as Interfaces from '../inc/interfaces';
import * as Enums from '../inc/enums';

import { ProjectState } from './State';
import { Component } from './Component';

export class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: Enums.ProjectStatus
    ) {}
}

export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInput: HTMLInputElement;
    descriptionInput: HTMLInputElement;
    peopleInput: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input');

        this.titleInput = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInput = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInput = this.element.querySelector('#people') as HTMLInputElement;

        this.configure();
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler);
    }

    renderContent() {}

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInput.value;
        const enteredDescription = this.descriptionInput.value;
        const enteredPeople = this.peopleInput.value;

        const titleValidate: Interfaces.Validatable = {
            value: enteredTitle,
            required: true,
        };

        const descriptionValidate: Interfaces.Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5,
        };

        const peopleValidate: Interfaces.Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5,
        };

        if (
            !Functions.validate(titleValidate) ||
            !Functions.validate(descriptionValidate) ||
            !Functions.validate(peopleValidate)
        ) {
            alert('Invalid input! Please try again!');
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }

    private clearInput() {
        this.titleInput.value = '';
        this.descriptionInput.value = '';
        this.peopleInput.value = '';
    }

    @Decorators.Autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();

        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;

            const projectState = ProjectState.getInstance();
            projectState.addProject(title, description, people);

            this.clearInput();
        }
    }
}

export class ProjectList extends Component<HTMLDivElement, HTMLElement> {
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    configure() {
        const projectState = ProjectState.getInstance();
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter((project) => {
                if (this.type === 'active') {
                    return project.status === Enums.ProjectStatus.Active;
                }

                return project.status === Enums.ProjectStatus.Finished;
            });

            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;

        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        const lastChildIndex = this.assignedProjects.length - 1;

        listEl.innerHTML = '';

        this.assignedProjects.forEach((projectItem, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = projectItem.title;

            if (this.type === 'active' && index !== lastChildIndex) {
                listItem.classList.add('visible');
            }

            listEl.appendChild(listItem);

            if (this.type === 'active' && index === lastChildIndex) {
                setTimeout(() => {
                    listItem.classList.add('visible');
                }, 100);
            }
        });
    }
}
