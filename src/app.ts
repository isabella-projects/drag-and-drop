import './style.css';

import { ProjectInput, ProjectList } from './modules/Project';

const projectInput = new ProjectInput();

const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
