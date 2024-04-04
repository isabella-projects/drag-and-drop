import * as Decorators from '../inc/decorators';
import * as Functions from '../inc/functions';
import * as Interfaces from '../inc/interfaces';
import * as Enums from '../inc/enums';

import { ProjectState } from './State';
import { Component } from './Component';

const projectState = ProjectState.getInstance();

export class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: Enums.ProjectStatus
    ) {}
}

export class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Interfaces.Draggable {
    private project: Project;

    get persons() {
        if (this.project.people === 1) {
            return '1 person';
        } else {
            return `${this.project.people} persons`;
        }
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure();
        this.renderContent();
    }

    @Decorators.Autobind
    dragStartHandler(event: DragEvent) {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    dragEndHandler(_: DragEvent) {
        console.log('Drag ended');
    }

    @Decorators.Autobind
    deleteHandler() {
        const projectId = this.project.id;
        projectState.removeProject(projectId);
        this.element.remove();
    }

    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
        const trashIcon = this.element.querySelector('.fa-trash')! as HTMLElement;
        trashIcon.addEventListener('click', this.deleteHandler);
    }

    renderContent() {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned to this project.';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}

export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements Interfaces.DragTarget {
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    @Decorators.Autobind
    dragOverHandler(event: DragEvent) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    @Decorators.Autobind
    dropHandler(event: DragEvent) {
        const projectId = event.dataTransfer!.getData('text/plain');
        projectState.moveProject(
            projectId,
            this.type === 'active' ? Enums.ProjectStatus.Active : Enums.ProjectStatus.Finished
        );
    }

    @Decorators.Autobind
    dragLeaveHandler(_: DragEvent) {
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

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
            const listItem = new ProjectItem(this.element.querySelector('ul')!.id, projectItem);

            if (this.type === 'active' || index === lastChildIndex) {
                listItem.element.classList.add('visible');
            }

            listEl.appendChild(listItem.element);
        });
    }
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
