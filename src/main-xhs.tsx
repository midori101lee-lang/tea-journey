import { createRoot } from 'react-dom/client';
import XhsApp from './app/XhsApp';
import './styles/tokens.css';
import './styles/base.css';

const el = document.getElementById('root');
if (el) createRoot(el).render(<div className="app"><XhsApp /></div>);
