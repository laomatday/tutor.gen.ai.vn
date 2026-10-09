import './fonts.css';
import './index.css';
import './public-site.css';
import './styles/tutor-compat.css';
import './styles/learning-os.css';
import './styles/advanced-workspace.css';
import './styles/mvp-pages.css';
import {createRoot} from 'react-dom/client';
import App from './app/App';
import {CurriculumProvider} from './context/CurriculumContext';
import {TutorAuthProvider} from './features/pilot/TutorAuthContext';

createRoot(document.getElementById('root')!).render(<TutorAuthProvider><CurriculumProvider><App /></CurriculumProvider></TutorAuthProvider>);
