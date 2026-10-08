import './fonts.css';
import './index.css';
import './public-site.css';
import './styles/tutor-compat.css';
import './styles/learning-os.css';
import {createRoot} from 'react-dom/client';
import App from './app/App';
import {CurriculumProvider} from './context/CurriculumContext';

createRoot(document.getElementById('root')!).render(<CurriculumProvider><App /></CurriculumProvider>);
