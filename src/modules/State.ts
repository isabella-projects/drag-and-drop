import { ProjectStatus } from '../inc/enums';
import { Listener } from '../inc/types';

import { v4 as uuid } from 'uuid';
import { Project } from './Project';

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

export class ProjectState extends State<Project> {
    public projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }

        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, numOfPeople: number) {
        const projectId = uuid();
        const newProject = new Project(projectId, title, description, numOfPeople, ProjectStatus.Active);

        this.projects.push(newProject);
        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find((prj) => {
            return prj.id === projectId;
        });

        if (project && project.status !== newStatus) {
            project.status = newStatus;
            this.updateListeners();
        }
    }

    removeProject(projectId: string) {
        const projectIndex = this.projects.findIndex((project) => project.id === projectId);
        if (projectIndex !== -1) {
            this.projects.splice(projectIndex, 1);
            this.updateListeners();
        }
    }

    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
