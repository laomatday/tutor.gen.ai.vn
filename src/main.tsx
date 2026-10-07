import './index.css';
import {createRoot} from 'react-dom/client';
import App from './app/App';
import {CurriculumProvider} from './context/CurriculumContext';

createRoot(document.getElementById('root')!).render(<CurriculumProvider><App /></CurriculumProvider>);
