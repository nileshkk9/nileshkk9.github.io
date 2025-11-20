import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Globe,
  Folder,
  X,
  Minus,
  Maximize2,
  Search,
  Wifi,
  Battery,
  Github,
  Linkedin,
  Mail,
  Briefcase,
  Code,
  User,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Command,
  Cpu,
  Layers,
  Zap,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  ArrowLeft,
  ArrowRight,
  Settings,
  GraduationCap,
  Download,
  ExternalLink,
  Copy,
  Check,
  Maximize,
  Minimize2,
  Minus as MinusIcon,
  Plus,
  Minus as MinusIcon2,
  BookOpen
} from 'lucide-react';

// --- Data & Constants ---

const USER_DATA = {
  name: 'Nilesh Kr. Pandey',
  role: 'Software Engineer (SDE2)',
  summary:
    'Software Engineer (SDE2) focused on backend/platform systems that reduce cost and improve reliability at scale—maps/routing, RAG applications, queues, and developer tooling. Delivered 60–70% cost savings by replacing Google Maps with a custom map UI and routing service. Boosted solution-developer efficiency by 45% with a language server while cutting bug resolution time by 40%. Built a production-ready RAG app with FastAPI, LangChain, and OpenSearch. Optimized bulk dispatch with SQS to eliminate crashes and ship 40% faster batch dispatch. Core strengths: distributed systems, API design, data/LLM retrieval, observability, queue-based backpressure, and capacity planning algorithms.',
  social: {
    email: 'nileshkk9@gmail.com',
    linkedin: 'linkedin.com/in/nilesh-kumar-pandey',
    github: 'github.com/nileshkk9',
    leetcode: 'leetcode.com/nileshkk9'
  },
  experience: [
    {
      company: 'Zinier',
      role: 'Software Engineer 2',
      period: 'Nov 2022 - Present',
      location: 'Bangalore Urban, Karnataka, India · Hybrid',
      details: [
        'Developed a Language Server that increased solution-developer efficiency by 45% and reduced bug resolution time by 40% via rich diagnostics, autocomplete, and static checks.',
        'Built a custom map UI and routing service to replace Google Maps, achieving 60–70% cost savings while maintaining routing accuracy and user experience. Technologies: Python, mapping SDKs, routing engines, frontend integration.',
        'Shipped a production-ready RAG (Retrieval-Augmented Generation) app using FastAPI, LangChain, and OpenSearch, improving knowledge retrieval latency and developer support at scale.',
        'Optimized bulk dispatch with SQS-based queues to prevent server crashes and enable 40% faster batch job dispatch through backpressure and concurrency tuning.',
        'Designed an appointment window capacity algorithm to improve technician capacity planning accuracy and scheduling throughput.'
      ]
    },
    {
      company: 'udaan.com',
      role: 'Application Developer',
      period: 'Feb 2022 - Nov 2022',
      location: 'Bengaluru, Karnataka, India · Hybrid',
      details: [
        'Worked in Supply Chain cluster, Solving and Optimizing Warehouse inbound process.',
        'Reduced inbound processing time by ~70% by streamlining warehouse workflows and eliminating bottlenecks across supply chain systems.',
        'Cut Non-FCR (First Call Resolution) issues by 70–80% by addressing ground constraints and delivering targeted fixes in execution systems.',
        'Deployed solutions to stabilize inbound processes and improve operational visibility across stakeholders.'
      ]
    },
    {
      company: 'Infosys',
      role: 'Power Programmer',
      period: 'Nov 2020 - Feb 2022',
      location: 'Pune, Maharashtra, India · Remote',
      details: [
        'Worked on a Citibank Advice Generation System.',
        'Migrated legacy front-end libraries to modern versions for a Citibank Advice Generation system, improving maintainability and security posture.',
        'Remediated Spring MVC vulnerabilities and reduced exposure by updating dependencies and hardening configuration.'
      ]
    }
  ],
  skills: {
    languages: [
      'JavaScript',
      'Java',
      'Python',
      'C++',
      'PHP',
      'HTML',
      'CSS',
      'SQL',
      'Kotlin',
      'TypeScript'
    ],
    frameworks: [
      'React.js',
      'Node.js',
      'NestJS',
      'Next.js',
      'Spring Boot',
      'ExpressJS',
      'FastAPI'
    ],
    tools: [
      'AWS',
      'Microsoft Azure',
      'Kubernetes',
      'Docker',
      'OTEL',
      'Grafana',
      'DAPR',
      'SQS',
      'OpenSearch',
      'LangChain',
      'Git'
    ],
    databases: ['MySQL', 'MongoDB', 'SQLite'],
    specialized: [
      'RAG (Retrieval-Augmented Generation)',
      'LLM (Large Language Models)',
      'Microservices',
      'Software Infrastructure',
      'Software Design',
      'Back-End Web Development',
      'Cloud Computing'
    ]
  },
  projects: [
    {
      name: 'Hackergrade',
      desc: 'Educational Website (Prod)',
      link: 'hackergrade.com',
      tech: ['React', 'Node.js', 'MongoDB'],
      details: 'A comprehensive educational platform for students and teachers.'
    },
    {
      name: 'Eugenics',
      desc: 'Reporting PWA for employees',
      link: 'Internal',
      tech: ['React', 'PWA', 'Express'],
      details: 'Progressive Web App for employee reporting and management.'
    },
    {
      name: 'Cam To You',
      desc: 'Facial Clustering App',
      link: 'Demo',
      tech: ['Python', 'ML', 'FastAPI'],
      details:
        'Machine learning application for facial recognition and clustering.'
    }
  ],
  education: [
    {
      degree: 'Bachelor of Technology - BTech',
      field: 'Information Technology',
      institution: 'Netaji Subhash Engineering College (NSEC)',
      period: '2016 - 2020',
      grade: '8.3',
      details:
        'Focused on software engineering, algorithms, and information technology systems.'
    },
    {
      degree: '12th Grade',
      field: 'Science',
      institution: 'St. Francis Xavier School',
      period: '2013 - 2015',
      grade: '83',
      details: 'High school education with focus on Science stream.'
    }
  ],
  certifications: [
    {
      name: 'Oracle Certified Associate, Java SE 8 Programmer',
      issuer: 'Oracle',
      year: '2021',
      month: 'May',
      skills: ['Java', 'Java Database Connectivity (JDBC)']
    },
    {
      name: 'Oracle Certified Professional, Java SE 8 Programmer',
      issuer: 'Oracle',
      year: '2021',
      month: 'May',
      skills: ['Java']
    },
    {
      name: 'Cloud Computing',
      issuer: 'NPTEL',
      year: '2018',
      month: 'Mar'
    }
  ],
  publications: [
    {
      title: 'FEATURE SELECTION USING THE CONCEPT OF PEAFOWL MATING IN IDS',
      journal: 'International Journal of Computer Networks & Communications',
      date: 'Feb 3, 2024',
      description:
        'This publication introduces a novel Intrusion Detection System (IDS) model leveraging the Peafowl Mating Algorithm (PFM) for feature selection. By reducing dataset complexity and improving anomaly detection, the model ensures faster, more accurate threat prevention in cloud environments.'
    }
  ]
};

// --- Assets ---

const AppleLogo = () => (
  <svg
    viewBox="0 0 842.32007 1000.0001"
    className="w-4 h-4 fill-white"
    style={{ minWidth: '16px', minHeight: '16px' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#fff"
      d="M824.66636 779.30363c-15.12299 34.93724-33.02368 67.09674-53.7638 96.66374-28.27076 40.3074-51.4182 68.2078-69.25717 83.7012-27.65347 25.4313-57.2822 38.4556-89.00964 39.1963-22.77708 0-50.24539-6.4813-82.21973-19.629-32.07926-13.0861-61.55985-19.5673-88.51583-19.5673-28.27075 0-58.59083 6.4812-91.02193 19.5673-32.48053 13.1477-58.64639 19.9994-78.65196 20.6784-30.42501 1.29623-60.75123-12.0985-91.02193-40.2457-19.32039-16.8514-43.48632-45.7394-72.43607-86.6641-31.060778-43.7024-56.597041-94.37983-76.602609-152.15586C10.740416 658.44309 0 598.01283 0 539.50845c0-67.01648 14.481044-124.8172 43.486336-173.25401C66.28194 327.34823 96.60818 296.6578 134.5638 274.1276c37.95566-22.53016 78.96676-34.01129 123.1321-34.74585 24.16591 0 55.85633 7.47508 95.23784 22.166 39.27042 14.74029 64.48571 22.21538 75.54091 22.21538 8.26518 0 36.27668-8.7405 83.7629-26.16587 44.90607-16.16001 82.80614-22.85118 113.85458-20.21546 84.13326 6.78992 147.34122 39.95559 189.37699 99.70686-75.24463 45.59122-112.46573 109.4473-111.72502 191.36456.67899 63.8067 23.82643 116.90384 69.31888 159.06309 20.61664 19.56727 43.64066 34.69027 69.2571 45.4307-5.55531 16.11062-11.41933 31.54225-17.65372 46.35662zM631.70926 20.0057c0 50.01141-18.27108 96.70693-54.6897 139.92782-43.94932 51.38118-97.10817 81.07162-154.75459 76.38659-.73454-5.99983-1.16045-12.31444-1.16045-18.95003 0-48.01091 20.9006-99.39207 58.01678-141.40314 18.53027-21.27094 42.09746-38.95744 70.67685-53.0663C578.3158 9.00229 605.2903 1.31621 630.65988 0c.74076 6.68575 1.04938 13.37191 1.04938 20.00505z"
    />
  </svg>
);

// --- Components ---

const WindowControls = ({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false
}) => (
  <div className="flex gap-2 p-3 group">
    <button
      onClick={onClose}
      className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center text-black/0 group-hover:text-black/50 transition-colors shadow-sm"
    >
      <X size={6} strokeWidth={3} />
    </button>
    <button
      onClick={onMinimize}
      className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center text-black/0 group-hover:text-black/50 transition-colors shadow-sm"
    >
      <Minus size={6} strokeWidth={3} />
    </button>
    <button
      onClick={onMaximize}
      className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] flex items-center justify-center text-black/0 group-hover:text-black/50 transition-colors shadow-sm"
    >
      {isMaximized ? (
        <Maximize size={6} strokeWidth={3} />
      ) : (
        <Maximize2 size={6} strokeWidth={3} />
      )}
    </button>
  </div>
);

const DockItem = ({
  icon: Icon,
  label,
  isOpen,
  onClick,
  bgColor = 'bg-gray-100',
  iconColor = 'text-gray-700'
}) => (
  <div className="group relative flex flex-col items-center gap-1">
    <span className="absolute -top-14 px-3 py-1 bg-gray-900/90 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-md border border-white/10 whitespace-nowrap pointer-events-none shadow-xl z-50">
      {label}
    </span>

    <button
      onClick={onClick}
      className={`w-12 h-12 md:w-14 md:h-14 ${bgColor} rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:-translate-y-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 active:brightness-90 border border-white/10`}
    >
      <Icon
        size={28}
        className={`${iconColor} drop-shadow-sm`}
        strokeWidth={1.5}
      />
    </button>

    <div
      className={`w-1 h-1 rounded-full bg-gray-800 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      } transition-all duration-300 mt-1`}
    />
  </div>
);

const MenuItem = ({ label, active, onClick, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`px-3 h-full flex items-center rounded hover:bg-white/20 transition-colors ${
          isOpen ? 'bg-white/20' : ''
        } ${active ? 'font-bold' : ''}`}
        onClick={() => {
          onClick && onClick();
          if (children) setIsOpen(!isOpen);
        }}
      >
        {label}
      </button>
      {isOpen && children && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 py-1 text-gray-800 z-[999]">
          {children}
        </div>
      )}
    </div>
  );
};

// --- File System Logic ---

// Helper to generate file system structure from USER_DATA
const generateFileSystem = () => {
  return {
    Desktop: {
      type: 'folder',
      children: {
        'Resume.pdf': { type: 'pdf', content: 'Nilesh Resume 2025' },
        Projects: {
          type: 'folder',
          children: USER_DATA.projects.reduce(
            (acc, proj) => ({
              ...acc,
              [`${proj.name}.webloc`]: {
                type: 'webloc',
                url: `https://${proj.link}`,
                desc: proj.desc
              }
            }),
            {}
          )
        },
        Work: {
          type: 'folder',
          children: USER_DATA.experience.reduce(
            (acc, exp) => ({
              ...acc,
              [`${exp.company}.txt`]: {
                type: 'text',
                content: `${exp.role}\n${exp.period}\n\n${exp.details.join(
                  '\n- '
                )}`
              }
            }),
            {}
          )
        },
        'Contact.txt': {
          type: 'text',
          content: `Email: ${USER_DATA.social.email}\nLinkedIn: ${USER_DATA.social.linkedin}\nGithub: ${USER_DATA.social.github}`
        }
      }
    },
    Documents: {
      type: 'folder',
      children: {
        'Notes.txt': {
          type: 'text',
          content: 'Meeting notes: Discuss new architecture.'
        },
        Certifications: {
          type: 'folder',
          children: {
            'Java_OCP.pdf': {
              type: 'pdf',
              content: 'Oracle Certified Professional'
            },
            'AWS_Cloud.pdf': { type: 'pdf', content: 'AWS Certified' }
          }
        }
      }
    },
    Downloads: { type: 'folder', children: {} },
    Applications: {
      type: 'folder',
      children: {
        Safari: { type: 'app', appId: 'safari' },
        Terminal: { type: 'app', appId: 'terminal' },
        Mail: { type: 'app', appId: 'mail' }
      }
    }
  };
};

const FILE_SYSTEM = generateFileSystem();

// --- Apps ---

const FinderApp = ({ onOpenFile, onOpenApp }) => {
  const [currentPath, setCurrentPath] = useState(['Desktop']); // Array of folder keys
  const [history, setHistory] = useState([['Desktop']]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Resolve path to object
  const getCurrentFolder = () => {
    let pointer = FILE_SYSTEM;
    for (let i = 0; i < currentPath.length; i++) {
      if (i === 0) {
        pointer = pointer[currentPath[i]];
      } else {
        pointer = pointer.children[currentPath[i]];
      }
      if (!pointer) return { children: {} }; // Safety
    }
    return pointer;
  };

  const currentFolderData = getCurrentFolder();
  let items = currentFolderData.children
    ? Object.entries(currentFolderData.children)
    : [];

  // Filter items based on search query
  if (searchQuery) {
    items = items.filter(([name]) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleNavigate = (folderName) => {
    const newPath = [...currentPath, folderName];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPath);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(newPath);
    setSelectedItem(null);
  };

  const handleSidebarClick = (root) => {
    const newPath = [root];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPath);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(newPath);
    setSelectedItem(null);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
      setSelectedItem(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
      setSelectedItem(null);
    }
  };

  const handleItemDoubleClick = (name, item) => {
    if (item.type === 'folder') {
      handleNavigate(name);
    } else if (item.type === 'app') {
      onOpenApp(item.appId);
    } else if (item.type === 'pdf' && name === 'Resume.pdf') {
      // Download resume
      const blob = new Blob([item.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // File
      onOpenFile(name, item);
    }
  };

  // Icon helper
  const getIcon = (type) => {
    switch (type) {
      case 'folder':
        return <Folder size={48} className="text-blue-400 fill-blue-400" />;
      case 'pdf':
        return (
          <div className="w-12 h-14 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
            PDF
          </div>
        );
      case 'text':
        return <FileText size={48} className="text-gray-500" />;
      case 'webloc':
        return <Globe size={48} className="text-blue-500" />;
      case 'app':
        return <Layers size={48} className="text-purple-500" />;
      default:
        return <FileText size={48} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 select-none">
      {/* Finder Toolbar */}
      <div className="h-12 bg-[#f5f5f7] border-b border-gray-200 flex items-center px-4 gap-4">
        <div className="flex gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className={`p-1 rounded-md ${
              historyIndex === 0
                ? 'text-gray-300'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex === history.length - 1}
            className={`p-1 rounded-md ${
              historyIndex === history.length - 1
                ? 'text-gray-300'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex-1 font-semibold text-gray-700 text-center text-sm">
          {currentPath[currentPath.length - 1]}
        </div>
        <div className="flex gap-2 text-gray-500">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded ${
              viewMode === 'grid' ? 'bg-gray-300' : 'hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded ${
              viewMode === 'list' ? 'bg-gray-300' : 'hover:bg-gray-200'
            }`}
          >
            <ListIcon size={16} />
          </button>
        </div>
        <div className="w-48 relative">
          <Search size={14} className="absolute left-2 top-1.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-200/50 border border-gray-300 rounded-md pl-7 pr-2 py-1 text-xs outline-none focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-[#f5f5f7]/80 backdrop-blur-xl border-r border-gray-200 pt-4 hidden sm:flex flex-col">
          <div className="mb-4">
            <div className="text-[11px] font-bold text-gray-400 mb-1 px-4">
              Favorites
            </div>
            <div className="space-y-0.5 px-2">
              {['Desktop', 'Documents', 'Downloads', 'Applications'].map(
                (item) => (
                  <div
                    key={item}
                    onClick={() => handleSidebarClick(item)}
                    className={`px-2 py-1.5 rounded-md text-sm flex items-center gap-2 cursor-pointer ${
                      currentPath[0] === item && currentPath.length === 1
                        ? 'bg-gray-300/50 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    {item === 'Applications' ? (
                      <Layers size={15} className="text-purple-500" />
                    ) : (
                      <Folder
                        size={15}
                        className={`fill-current ${
                          item === 'Desktop' ? 'text-blue-500' : 'text-blue-400'
                        }`}
                      />
                    )}
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-gray-400 mb-1 px-4">
              iCloud
            </div>
            <div className="space-y-0.5 px-2">
              <div className="px-2 py-1.5 rounded-md text-sm flex items-center gap-2 cursor-default text-gray-600 hover:bg-gray-200/50 opacity-50">
                <div className="w-4 h-4 rounded-full border border-blue-400 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                iCloud Drive
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className="flex-1 p-4 bg-white overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-2">📂</span>
              <p>{searchQuery ? 'No results found' : 'Folder is empty'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 items-start content-start">
              {items.map(([name, item]) => (
                <div
                  key={name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(name);
                  }}
                  onDoubleClick={() => handleItemDoubleClick(name, item)}
                  className={`flex flex-col items-center gap-1 group cursor-pointer p-2 rounded-md border border-transparent ${
                    selectedItem === name
                      ? 'bg-blue-100 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="h-14 flex items-center justify-center drop-shadow-sm transition-transform group-active:scale-95">
                    {getIcon(item.type)}
                  </div>
                  <span
                    className={`text-xs text-center leading-tight px-1 rounded ${
                      selectedItem === name
                        ? 'bg-blue-500 text-white font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {name.replace(/\.[^/.]+$/, '')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {items.map(([name, item]) => (
                <div
                  key={name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(name);
                  }}
                  onDoubleClick={() => handleItemDoubleClick(name, item)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                    selectedItem === name ? 'bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                  <span className="flex-1 text-sm text-gray-700">{name}</span>
                  <span className="text-xs text-gray-400">{item.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="h-6 bg-[#f5f5f7] border-t border-gray-200 flex items-center px-3 text-xs text-gray-500 font-medium justify-between">
        <span>{items.length} items</span>
        <span>{250 - items.length * 0.5} GB available</span>
      </div>
    </div>
  );
};

const TerminalApp = () => {
  const [history, setHistory] = useState([
    {
      type: 'output',
      content: `Last login: ${new Date().toDateString()} on ttys001`
    },
    { type: 'output', content: 'Type "help" to see available commands.' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      const newHistory = [...history, { type: 'input', content: input }];

      let output = '';
      switch (cmd) {
        case 'help':
          output =
            'Available commands: \n  whoami    - Display user info\n  about     - Summary\n  contact   - Contact details\n  experience - Work history\n  skills    - Tech stack\n  projects  - List projects\n  ls        - List directory\n  clear     - Clear terminal';
          break;
        case 'whoami':
          output = `${USER_DATA.name}\n${USER_DATA.role}`;
          break;
        case 'about':
          output = USER_DATA.summary;
          break;
        case 'contact':
          output = `Email: ${USER_DATA.social.email}\nLinkedIn: ${USER_DATA.social.linkedin}\nGitHub: ${USER_DATA.social.github}`;
          break;
        case 'skills':
          output = `LANGUAGES: ${USER_DATA.skills.languages.join(
            ', '
          )}\nFRAMEWORKS: ${USER_DATA.skills.frameworks.join(
            ', '
          )}\nTOOLS: ${USER_DATA.skills.tools.join(', ')}`;
          break;
        case 'projects':
          output = USER_DATA.projects
            .map((p) => `* ${p.name}: ${p.desc}`)
            .join('\n');
          break;
        case 'ls':
          output = 'Desktop  Documents  Downloads  Applications  Public';
          break;
        case 'experience':
          output = USER_DATA.experience
            .map((exp) => `[${exp.period}] ${exp.company} - ${exp.role}`)
            .join('\n');
          break;
        case 'clear':
          setHistory([]);
          setInput('');
          return;
        case '':
          break;
        default:
          output = `zsh: command not found: ${cmd}`;
      }

      if (output) {
        newHistory.push({ type: 'output', content: output });
      }

      setHistory(newHistory);
      setInput('');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#1a1b26] text-[#a9b1d6] font-mono text-sm p-2 font-medium leading-relaxed selection:bg-[#3d59a1] selection:text-white"
      onClick={() => document.getElementById('term-input')?.focus()}
    >
      <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={scrollRef}>
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line.type === 'input' ? (
              <div className="flex gap-2 items-center mt-1">
                <span className="text-[#9ece6a] font-bold">➜</span>
                <span className="text-[#7aa2f7] font-bold">~</span>
                <span className="text-[#c0caf5]">{line.content}</span>
              </div>
            ) : (
              <div className="text-[#a9b1d6] pl-6 opacity-90">
                {line.content}
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2 items-center mt-1">
          <span className="text-[#9ece6a] font-bold">➜</span>
          <span className="text-[#7aa2f7] font-bold">~</span>
          <input
            id="term-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            className="bg-transparent border-none outline-none flex-1 text-[#c0caf5] caret-[#c0caf5]"
            autoFocus
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};

const SafariApp = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'about');
  const [tabHistory, setTabHistory] = useState(['about']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setTabHistory([initialTab]);
      setHistoryIndex(0);
    }
  }, [initialTab]);

  const navigateToTab = (tab) => {
    const newHistory = tabHistory.slice(0, historyIndex + 1);
    newHistory.push(tab);
    setTabHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setActiveTab(tab);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setActiveTab(tabHistory[historyIndex - 1]);
    }
  };

  const handleForward = () => {
    if (historyIndex < tabHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setActiveTab(tabHistory[historyIndex + 1]);
    }
  };

  const handleRefresh = () => {
    // Just trigger a re-render by updating state
    setActiveTab((prev) => prev);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'experience':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
              Work Experience
            </h2>
            {USER_DATA.experience.map((job, i) => (
              <div
                key={i}
                className="relative pl-6 border-l-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500" />
                <h3 className="text-xl font-bold text-gray-800">
                  {job.company}
                </h3>
                <div className="text-blue-600 font-medium mb-1">{job.role}</div>
                <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider font-semibold">
                  {job.period}
                </div>
                {job.location && (
                  <div className="text-gray-500 text-xs mb-3">
                    {job.location}
                  </div>
                )}
                <ul className="space-y-2 text-gray-600 text-sm leading-relaxed">
                  {job.details.map((point, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-blue-400 mt-1.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case 'projects':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="col-span-full mb-4">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Projects
                </h2>
                <p className="text-gray-500">Selected works & experiments.</p>
              </div>
              {USER_DATA.projects.map((proj, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedProject(proj)}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                      <Code size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {proj.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {proj.desc}
                  </p>
                  {proj.tech && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {proj.tech.map((tech, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    View Details <ChevronRight size={14} className="ml-1" />
                  </div>
                </div>
              ))}
            </div>
            {selectedProject && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                onClick={() => setSelectedProject(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedProject.name}
                    </h3>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedProject.desc}</p>
                  {selectedProject.details && (
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {selectedProject.details}
                    </p>
                  )}
                  {selectedProject.tech && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Technologies:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech.map((tech, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProject.link &&
                    selectedProject.link !== 'Internal' &&
                    selectedProject.link !== 'Demo' && (
                      <a
                        href={`https://${selectedProject.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Visit Project <ExternalLink size={16} />
                      </a>
                    )}
                </div>
              </div>
            )}
          </>
        );
      case 'skills':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
              Skills & Technologies
            </h2>
            {Object.entries(USER_DATA.skills).map(([category, items]) => (
              <div
                key={category}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize flex items-center gap-2">
                  {category === 'languages' && (
                    <Zap size={20} className="text-yellow-500" />
                  )}
                  {category === 'frameworks' && (
                    <Layers size={20} className="text-blue-500" />
                  )}
                  {category === 'tools' && (
                    <Cpu size={20} className="text-purple-500" />
                  )}
                  {category === 'databases' && (
                    <Layers size={20} className="text-green-500" />
                  )}
                  {category === 'specialized' && (
                    <Zap size={20} className="text-orange-500" />
                  )}
                  {category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {skill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      case 'education':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
              Education
            </h2>
            {USER_DATA.education.map((edu, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <GraduationCap size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">
                      {edu.degree}
                    </h3>
                    <p className="text-blue-600 font-medium mb-1">
                      {edu.field}
                    </p>
                    <p className="text-gray-500 text-sm mb-2">
                      {edu.institution}
                    </p>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">
                      {edu.period}
                    </p>
                    {edu.grade && (
                      <p className="text-gray-600 text-sm font-medium mb-2">
                        Grade: {edu.grade}
                      </p>
                    )}
                    {edu.details && (
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {edu.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {USER_DATA.certifications &&
              USER_DATA.certifications.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Certifications
                  </h3>
                  <div className="space-y-3">
                    {USER_DATA.certifications.map((cert, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {cert.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {cert.issuer}
                            </p>
                            {cert.skills && cert.skills.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Skills: {cert.skills.join(' · ')}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {cert.month
                              ? `Issued ${cert.month} ${cert.year}`
                              : cert.year}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        );
      case 'publications':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
              Publications
            </h2>
            {USER_DATA.publications && USER_DATA.publications.length > 0 ? (
              <div className="space-y-6">
                {USER_DATA.publications.map((pub, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {pub.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                          {pub.journal}
                        </p>
                        <p className="text-xs text-gray-400">{pub.date}</p>
                      </div>
                      <BookOpen
                        size={24}
                        className="text-blue-500 flex-shrink-0 ml-4"
                      />
                    </div>
                    {pub.description && (
                      <p className="text-gray-600 text-sm leading-relaxed mt-4">
                        {pub.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>No publications available</p>
              </div>
            )}
          </div>
        );
      case 'contact':
        return (
          <div className="max-w-3xl mx-auto pt-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
              Get In Touch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                    <Mail size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Email</h3>
                </div>
                <a
                  href={`mailto:${USER_DATA.social.email}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {USER_DATA.social.email}
                </a>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0077b5] flex items-center justify-center text-white">
                    <Linkedin size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">LinkedIn</h3>
                </div>
                <a
                  href={`https://${USER_DATA.social.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {USER_DATA.social.linkedin}
                </a>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                    <Github size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">GitHub</h3>
                </div>
                <a
                  href={`https://${USER_DATA.social.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {USER_DATA.social.github}
                </a>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Send a Message
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const subject = formData.get('subject');
                  const body = formData.get('message');
                  window.open(
                    `mailto:${
                      USER_DATA.social.email
                    }?subject=${encodeURIComponent(
                      subject
                    )}&body=${encodeURIComponent(body)}`
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    placeholder="Your message..."
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Open Email Client
                </button>
              </form>
            </div>
          </div>
        );
      default: // about
        return (
          <div className="max-w-3xl mx-auto text-center pt-12 animate-in zoom-in-95 fade-in duration-500">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-8 flex items-center justify-center shadow-inner border-4 border-white">
              <span className="text-4xl">👨‍💻</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Hello, I'm Nilesh.
            </h1>
            <p className="text-xl text-blue-600 font-medium mb-8">
              {USER_DATA.role}
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-12 max-w-2xl mx-auto font-light">
              {USER_DATA.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {Object.entries(USER_DATA.skills)
                .slice(0, 3)
                .map(([category, items]) => (
                  <div
                    key={category}
                    className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <h4 className="font-bold text-gray-900 capitalize mb-3 text-sm tracking-wide flex items-center gap-2">
                      {category === 'languages' && (
                        <Zap
                          size={14}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      )}
                      {category === 'frameworks' && (
                        <Layers size={14} className="text-blue-500" />
                      )}
                      {category === 'tools' && (
                        <Cpu size={14} className="text-purple-500" />
                      )}
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-md text-gray-600 shadow-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Browser Toolbar */}
      <div className="bg-[#f5f5f7] border-b border-gray-300 p-2 flex items-center gap-4 h-12 px-4">
        <div className="flex gap-3 text-gray-500">
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className={`${
              historyIndex === 0
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:text-gray-800 cursor-pointer'
            } transition-colors`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex === tabHistory.length - 1}
            className={`${
              historyIndex === tabHistory.length - 1
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:text-gray-800 cursor-pointer'
            } transition-colors`}
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleRefresh}
            className="hover:text-gray-800 cursor-pointer transition-colors"
          >
            <RotateCw size={16} />
          </button>
        </div>
        <div className="flex-1 bg-white rounded-md border border-gray-300 shadow-sm h-8 flex items-center px-3 text-xs text-gray-600 mx-2 group focus-within:ring-2 ring-blue-400/50 transition-shadow">
          <div className="flex items-center gap-2 w-full justify-center group-focus-within:justify-start">
            {activeTab === 'about' ? (
              <User size={12} className="text-gray-400" />
            ) : (
              <Globe size={12} className="text-gray-400" />
            )}
            <span className="text-center">nilesh-pandey.dev/{activeTab}</span>
          </div>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-[#fbfbfd] border-r border-gray-200 pt-6 pb-4 flex-shrink-0 hidden md:flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase mb-2 px-4 tracking-wider">
              Menu
            </h3>
            <nav className="px-2 space-y-0.5">
              {[
                'about',
                'experience',
                'projects',
                'skills',
                'education',
                'publications',
                'contact'
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => navigateToTab(tab)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 flex items-center gap-3 ${
                    activeTab === tab
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'about' && <User size={16} />}
                  {tab === 'experience' && <Briefcase size={16} />}
                  {tab === 'projects' && <Code size={16} />}
                  {tab === 'skills' && <Zap size={16} />}
                  {tab === 'education' && <GraduationCap size={16} />}
                  {tab === 'publications' && <BookOpen size={16} />}
                  {tab === 'contact' && <Mail size={16} />}
                  <span className="capitalize">{tab}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white scroll-smooth">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const SettingsApp = () => {
  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="flex h-full bg-white">
      <div className="w-64 bg-[#f5f5f7] border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
        <nav className="space-y-1">
          {['general', 'appearance', 'notifications', 'privacy'].map(
            (section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === section
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            )
          )}
        </nav>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'general' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">General</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appearance
                </label>
                <select className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2">
                  <option>English</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'appearance' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Theme</span>
                <select className="border border-gray-300 rounded-md px-3 py-1">
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'notifications' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Notifications
            </h3>
            <p className="text-gray-600">
              Notification settings coming soon...
            </p>
          </div>
        )}
        {activeSection === 'privacy' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Privacy</h3>
            <p className="text-gray-600">Privacy settings coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const HelpApp = () => {
  const shortcuts = [
    { key: 'Cmd+K / Ctrl+K', desc: 'Open Spotlight Search' },
    { key: 'Cmd+W / Ctrl+W', desc: 'Close active window' },
    { key: 'Cmd+M / Ctrl+M', desc: 'Minimize active window' },
    { key: 'Cmd+? / Ctrl+?', desc: 'Show keyboard shortcuts' }
  ];

  return (
    <div className="h-full bg-white p-8 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Keyboard Shortcuts
      </h2>
      <div className="space-y-4">
        {shortcuts.map((shortcut, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="text-gray-700">{shortcut.desc}</span>
            <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-mono text-gray-800 shadow-sm">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tips</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Double-click desktop icons to open applications</li>
          <li>• Use the dock to quickly access apps</li>
          <li>• Drag windows by their title bars</li>
          <li>• Use Spotlight to quickly find and open apps</li>
        </ul>
      </div>
    </div>
  );
};

const SpotlightOverlay = ({ isOpen, onClose, onOpenApp }) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  const items = [
    {
      id: 'about',
      label: 'About Me',
      type: 'app',
      icon: User,
      appId: 'safari',
      tab: 'about'
    },
    {
      id: 'projects',
      label: 'Projects',
      type: 'app',
      icon: Code,
      appId: 'safari',
      tab: 'projects'
    },
    {
      id: 'experience',
      label: 'Experience',
      type: 'app',
      icon: Briefcase,
      appId: 'safari',
      tab: 'experience'
    },
    {
      id: 'skills',
      label: 'Skills',
      type: 'app',
      icon: Zap,
      appId: 'safari',
      tab: 'skills'
    },
    {
      id: 'education',
      label: 'Education',
      type: 'app',
      icon: GraduationCap,
      appId: 'safari',
      tab: 'education'
    },
    {
      id: 'publications',
      label: 'Publications',
      type: 'app',
      icon: BookOpen,
      appId: 'safari',
      tab: 'publications'
    },
    {
      id: 'terminal',
      label: 'Terminal',
      type: 'app',
      icon: Terminal,
      appId: 'terminal'
    },
    {
      id: 'settings',
      label: 'Settings',
      type: 'app',
      icon: Settings,
      appId: 'settings'
    },
    {
      id: 'help',
      label: 'Keyboard Shortcuts',
      type: 'app',
      icon: Command,
      appId: 'help'
    },
    {
      id: 'email',
      label: 'Send Email',
      type: 'action',
      icon: Mail,
      action: () => window.open(`mailto:${USER_DATA.social.email}`)
    }
  ];

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[600px] bg-gray-100/90 backdrop-blur-2xl border border-gray-400/50 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-300/50">
          <Search size={20} className="text-gray-500" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-xl text-gray-800 placeholder:text-gray-400 font-light"
            placeholder="Spotlight Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.length > 0 && (
          <div className="py-2">
            {filtered.map((item, i) => (
              <button
                key={item.id}
                className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-blue-500 hover:text-white transition-colors group ${
                  i === 0 ? 'bg-blue-500/10' : ''
                }`}
                onClick={() => {
                  if (item.type === 'app') onOpenApp(item.appId, item.tab);
                  else item.action();
                  onClose();
                }}
              >
                <item.icon
                  size={18}
                  className="text-gray-600 group-hover:text-white"
                />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs opacity-50 uppercase tracking-wider">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main OS Container ---

const App = () => {
  const [time, setTime] = useState(new Date());
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [windows, setWindows] = useState([
    {
      id: 'welcome',
      title: 'Welcome.txt',
      type: 'text',
      content:
        "Welcome to Nilesh's macOS Portfolio.\n\nTry 'Command + Space' to search.\n\n- Terminal: Interactive shell\n- Safari: Visual portfolio\n- Finder: File system",
      isOpen: true,
      isMin: false,
      z: 10,
      x: 100,
      y: 80,
      w: 500,
      h: 350
    }
  ]);
  const [activeId, setActiveId] = useState('welcome');
  const [maxZ, setMaxZ] = useState(10);
  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);

    const handleKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  // Window Management
  const openApp = (appId, tab = null) => {
    const existing = windows.find((w) => w.id === appId);

    if (existing) {
      if (existing.isMin || existing.isMinimizing) {
        // Restore minimized window with animation
        setWindows((prev) => {
          const win = prev.find((w) => w.id === appId);
          if (!win) return prev;

          const originalState = win.originalState || {
            x: 100,
            y: 50,
            w: 800,
            h: 600
          };

          return prev.map((w) =>
            w.id === appId
              ? {
                  ...w,
                  isMin: false,
                  isMinimizing: false,
                  x: originalState.x,
                  y: originalState.y,
                  w: originalState.w,
                  h: originalState.h,
                  // Clear minimize animation properties
                  minTargetX: undefined,
                  minTargetY: undefined,
                  minTargetW: undefined,
                  minTargetH: undefined
                }
              : w
          );
        });
        bringToFront(appId);
        return; // Return early to avoid double bringToFront
      }
      if (tab && appId === 'safari') {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === appId ? { ...w, initialTab: tab, z: maxZ + 1 } : w
          )
        );
      } else {
        bringToFront(appId);
      }
    } else {
      const newZ = maxZ + 1;
      setMaxZ(newZ);
      setActiveId(appId);

      let width = 900;
      let height = 650;
      let x = 100 + windows.length * 30;
      let y = 50 + windows.length * 30;

      if (appId === 'terminal') {
        width = 600;
        height = 400;
      }
      if (appId === 'finder') {
        width = 700;
        height = 450;
      }

      setWindows([
        ...windows,
        {
          id: appId,
          title:
            appId === 'safari'
              ? 'Safari'
              : appId === 'terminal'
              ? 'nilesh — -zsh'
              : 'Finder',
          type:
            appId === 'safari' || appId === 'terminal' || appId === 'finder'
              ? appId
              : 'text',
          isOpen: true,
          isMin: false,
          z: newZ,
          x,
          y,
          w: width,
          h: height,
          initialTab: tab
        }
      ]);
    }
  };

  const handleOpenFile = (fileName, item) => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);

    let width = 500;
    let height = 400;
    let title = fileName;
    let content = item.content;
    let type = 'text'; // Default window type

    if (item.type === 'pdf') {
      width = 600;
      height = 700;
      title = `Preview: ${fileName}`;
    } else if (item.type === 'webloc') {
      openApp('safari'); // weblocs just open safari for now, could support tab change
      return;
    }

    // Check if window already open
    const id = `file-${fileName}`;
    const existing = windows.find((w) => w.id === id);
    if (existing) {
      bringToFront(id);
      return;
    }

    setWindows([
      ...windows,
      {
        id,
        title,
        type, // This will be rendered as a simple text window for now
        content:
          item.type === 'pdf'
            ? `[PDF Viewer Simulation]\n\n${content}`
            : content,
        isOpen: true,
        isMin: false,
        z: newZ,
        x: 150 + windows.length * 20,
        y: 100 + windows.length * 20,
        w: width,
        h: height
      }
    ]);
  };

  const closeWindow = (id) => {
    setWindows(windows.filter((w) => w.id !== id));
  };

  const minimizeWindow = (id) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === id);
      if (!win) return prev;

      // Store original position for restore
      const originalState = {
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h
      };

      // Calculate dock position (center bottom, where dock is)
      // Dock is at bottom-4 (16px) with height ~60px, so center is at bottom-4 + 30px
      const dockX = window.innerWidth / 2 - win.w / 2;
      const dockY = window.innerHeight - 16 - 30; // Dock center position

      // Start animation - move window to dock position
      return prev.map((w) =>
        w.id === id
          ? {
              ...w,
              isMinimizing: true,
              minTargetX: dockX,
              minTargetY: dockY,
              minTargetW: win.w * 0.1,
              minTargetH: win.h * 0.1,
              originalState: originalState
            }
          : w
      );
    });

    // After animation completes, set as minimized
    setTimeout(() => {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                isMin: true,
                isMinimizing: false
                // originalState is preserved via spread operator
              }
            : w
        )
      );
      setActiveId(null);
    }, 300); // Match transition duration
  };

  const maximizeWindow = (id) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;

    const isMaximized = win.isMaximized;

    if (isMaximized) {
      // Restore to original position
      if (win.originalState) {
        setWindows(
          windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  x: win.originalState.x,
                  y: win.originalState.y,
                  w: win.originalState.w,
                  h: win.originalState.h,
                  isMaximized: false
                }
              : w
          )
        );
      } else {
        // Fallback to default size
        setWindows(
          windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  x: 100,
                  y: 50,
                  w: 800,
                  h: 600,
                  isMaximized: false
                }
              : w
          )
        );
      }
    } else {
      // Store current state before maximizing
      const originalState = {
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h
      };

      // Maximize to full screen (accounting for menu bar)
      setWindows(
        windows.map((w) =>
          w.id === id
            ? {
                ...w,
                x: 0,
                y: 28, // Menu bar height
                w: window.innerWidth,
                h: window.innerHeight - 28,
                isMaximized: true,
                originalState: originalState
              }
            : w
        )
      );
    }
    bringToFront(id);
  };

  const bringToFront = (id) => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setActiveId(id);
    setWindows(windows.map((w) => (w.id === id ? { ...w, z: newZ } : w)));
  };

  // Drag Logic
  const handleMouseDown = (e, id) => {
    e.preventDefault();
    const win = windows.find((w) => w.id === id);
    if (!win || win.isMaximized) return; // Don't allow dragging maximized windows
    bringToFront(id);
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initX: win.x,
      initY: win.y
    });
  };

  const handleResizeStart = (e, id, corner) => {
    e.preventDefault();
    e.stopPropagation();
    const win = windows.find((w) => w.id === id);
    if (!win) return;
    bringToFront(id);
    setResizeState({
      id,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      initW: win.w,
      initH: win.h,
      initX: win.x,
      initY: win.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizeState) {
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        setWindows((prev) =>
          prev.map((w) => {
            if (w.id === resizeState.id) {
              let newW = resizeState.initW;
              let newH = resizeState.initH;
              let newX = resizeState.initX;
              let newY = resizeState.initY;

              if (resizeState.corner.includes('e')) {
                newW = Math.max(300, resizeState.initW + dx);
              }
              if (resizeState.corner.includes('w')) {
                newW = Math.max(300, resizeState.initW - dx);
                newX = resizeState.initX + dx;
              }
              if (resizeState.corner.includes('s')) {
                newH = Math.max(200, resizeState.initH + dy);
              }
              if (resizeState.corner.includes('n')) {
                newH = Math.max(200, resizeState.initH - dy);
                newY = resizeState.initY + dy;
              }

              return { ...w, w: newW, h: newH, x: newX, y: newY };
            }
            return w;
          })
        );
      } else if (dragState) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        setWindows((prev) =>
          prev.map((w) => {
            if (w.id === dragState.id) {
              return { ...w, x: dragState.initX + dx, y: dragState.initY + dy };
            }
            return w;
          })
        );
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      setResizeState(null);
    };

    if (dragState || resizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState]);

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-cover bg-center select-none font-sans text-gray-900"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80")'
      }}
    >
      {/* Menu Bar */}
      <div className="h-7 bg-white/10 backdrop-blur-md flex items-center justify-between px-2 text-white text-sm z-[60] relative shadow-sm border-b border-white/10">
        <div className="flex items-center gap-1">
          <MenuItem label={<AppleLogo />} active>
            <div className="px-1 py-1">
              <div className="px-3 py-1 text-xs text-gray-500">
                macOS Portfolio
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('safari', 'about')}
              >
                About This Mac
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('settings')}
              >
                System Settings...
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() =>
                  window.open('https://www.apple.com/app-store/', '_blank')
                }
              >
                App Store...
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => alert('💤 System going to sleep...')}
              >
                Sleep
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => window.location.reload()}
              >
                Restart...
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => alert('🛑 Shutting down...')}
              >
                Shut Down...
              </button>
            </div>
          </MenuItem>
          <MenuItem label={<span className="font-bold">Finder</span>}>
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('finder')}
              >
                New Finder Window
              </button>
              <button className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm">
                Preferences...
              </button>
            </div>
          </MenuItem>
          <MenuItem label="File">
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() =>
                  activeId &&
                  openApp(
                    windows.find((w) => w.id === activeId)?.type || 'finder'
                  )
                }
              >
                New Window
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => activeId && closeWindow(activeId)}
                disabled={!activeId}
              >
                Close Window
              </button>
            </div>
          </MenuItem>
          <MenuItem label="Edit">
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => document.execCommand('copy')}
              >
                Copy
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => document.execCommand('paste')}
              >
                Paste
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => document.execCommand('selectAll')}
              >
                Select All
              </button>
            </div>
          </MenuItem>
          <MenuItem label="View">
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => alert('Sidebar toggled')}
              >
                Toggle Sidebar
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm">
                Zoom In
              </button>
              <button className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm">
                Zoom Out
              </button>
              <button className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm">
                Actual Size
              </button>
            </div>
          </MenuItem>
          <MenuItem label="Go">
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('finder')}
              >
                Desktop
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('finder')}
              >
                Documents
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('finder')}
              >
                Downloads
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('safari')}
              >
                Safari
              </button>
            </div>
          </MenuItem>
          <MenuItem label="Window">
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => windows.forEach((w) => minimizeWindow(w.id))}
              >
                Minimize All
              </button>
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => windows.forEach((w) => bringToFront(w.id))}
              >
                Bring All to Front
              </button>
              <div className="h-px bg-gray-200 my-1" />
              {windows
                .filter((w) => !w.isMin)
                .slice(0, 5)
                .map((win) => (
                  <button
                    key={win.id}
                    className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                    onClick={() => bringToFront(win.id)}
                  >
                    {win.title}
                  </button>
                ))}
            </div>
          </MenuItem>
          <MenuItem label="Help">
            <div className="px-1 py-1">
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('help')}
              >
                Keyboard Shortcuts
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full text-left px-3 py-1 hover:bg-blue-500 hover:text-white rounded text-sm"
                onClick={() => openApp('safari', 'about')}
              >
                About Portfolio
              </button>
            </div>
          </MenuItem>
        </div>
        <div className="flex items-center gap-4 px-2">
          <Battery size={18} className="text-gray-100" />
          <Wifi size={16} className="text-gray-100" />
          <button
            onClick={() => setSpotlightOpen(!spotlightOpen)}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <Search size={14} className="text-gray-100" />
          </button>
          <div className="flex gap-2 text-xs font-medium tracking-wide">
            <span>
              {time.toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span>
              {time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Spotlight Overlay */}
      <SpotlightOverlay
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onOpenApp={openApp}
      />

      {/* Desktop Area */}
      <div className="relative h-full w-full" onClick={() => setActiveId(null)}>
        {/* Desktop Icons */}
        <div className="absolute top-4 right-4 flex flex-col gap-6 items-end z-0">
          <div
            className="flex flex-col items-center gap-1 group cursor-pointer w-20"
            onDoubleClick={() => openApp('finder')}
          >
            <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors shadow-lg">
              <Folder
                size={36}
                className="text-blue-200 fill-blue-400 drop-shadow-lg"
              />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
              Work Stuff
            </span>
          </div>
          <div
            className="flex flex-col items-center gap-1 group cursor-pointer w-20"
            onClick={() =>
              window.open('https://github.com/nileshkk9', '_blank')
            }
          >
            <div className="w-16 h-16 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center group-hover:bg-gray-900/60 transition-colors shadow-lg">
              <Github size={36} className="text-white drop-shadow-lg" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
              GitHub
            </span>
          </div>
        </div>

        {/* Windows */}
        {windows.map((win) => {
          // Calculate transform and styles for minimize animation
          let transform = `translate(${win.x}px, ${win.y}px)`;
          let width = win.w;
          let height = win.h;
          let opacity = 1;
          let pointerEvents = 'auto';

          if (win.isMinimizing) {
            // Animate to dock position with scale
            transform = `translate(${win.minTargetX || win.x}px, ${
              win.minTargetY || win.y
            }px) scale(0.1)`;
            width = win.w;
            height = win.h;
            opacity = 0.3;
            pointerEvents = 'none';
          } else if (win.isMin) {
            // Fully minimized - hidden
            opacity = 0;
            pointerEvents = 'none';
            transform = `translate(${win.x}px, ${win.y}px) scale(0)`;
          }

          return (
            <div
              key={win.id}
              className={`absolute rounded-xl shadow-2xl overflow-hidden border border-black/10 transition-all duration-300 ease-in-out ${
                win.isMin ? 'pointer-events-none' : ''
              }`}
              style={{
                width: width,
                height: height,
                transform: transform,
                opacity: opacity,
                zIndex: win.z,
                transformOrigin: 'center center'
              }}
              onMouseDown={() => !win.isMin && bringToFront(win.id)}
            >
              {/* Title Bar */}
              <div
                className={`h-9 flex items-center justify-between px-3 cursor-default ${
                  win.type === 'terminal'
                    ? 'bg-[#1a1b26] text-gray-400'
                    : 'bg-[#f6f6f6] border-b border-gray-300'
                }`}
                onMouseDown={(e) => handleMouseDown(e, win.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <WindowControls
                    onClose={() => closeWindow(win.id)}
                    onMinimize={() => minimizeWindow(win.id)}
                    onMaximize={() => maximizeWindow(win.id)}
                    isMaximized={win.isMaximized}
                  />
                </div>
                <div className="flex-1 text-center text-xs font-semibold opacity-80 truncate px-2 flex items-center justify-center gap-2">
                  {win.type === 'terminal' && <Terminal size={12} />}
                  {win.title}
                </div>
                <div className="flex-1" />
              </div>

              {/* Content */}
              <div className="h-[calc(100%-36px)] overflow-hidden bg-white relative">
                {win.type === 'terminal' && <TerminalApp />}
                {win.type === 'safari' && (
                  <SafariApp initialTab={win.initialTab} />
                )}
                {win.type === 'finder' && (
                  <FinderApp onOpenApp={openApp} onOpenFile={handleOpenFile} />
                )}
                {win.type === 'settings' && <SettingsApp />}
                {win.type === 'help' && <HelpApp />}
                {win.type === 'text' && (
                  <div className="p-10 flex items-start justify-start h-full bg-white text-gray-800 font-mono text-sm whitespace-pre-wrap leading-relaxed overflow-y-auto">
                    {win.content}
                  </div>
                )}
              </div>
              {/* Resize Handles */}
              <div
                className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-10 opacity-0 hover:opacity-100 transition-opacity group"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'nw')}
              />
              <div
                className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'ne')}
              />
              <div
                className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'sw')}
              />
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'se')}
              />
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 cursor-ns-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'n')}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 cursor-ns-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 's')}
              />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full cursor-ew-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'w')}
              />
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-full cursor-ew-resize z-10 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, win.id, 'e')}
              />
            </div>
          );
        })}
      </div>

      {/* Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-full px-2">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 px-4 py-3 rounded-3xl flex items-end gap-3 shadow-2xl mb-1 box-content">
          <DockItem
            icon={Folder}
            label="Finder"
            isOpen={windows.some((w) => w.type === 'finder' && !w.isMin)}
            onClick={() => openApp('finder')}
            bgColor="bg-gradient-to-b from-sky-400 to-blue-600"
            iconColor="text-white"
          />
          <DockItem
            icon={Globe}
            label="Safari"
            isOpen={windows.some((w) => w.type === 'safari' && !w.isMin)}
            onClick={() => openApp('safari')}
            bgColor="bg-white"
            iconColor="text-blue-500"
          />
          <DockItem
            icon={Terminal}
            label="Terminal"
            isOpen={windows.some((w) => w.type === 'terminal' && !w.isMin)}
            onClick={() => openApp('terminal')}
            bgColor="bg-[#2a2b32]"
            iconColor="text-gray-200"
          />
          <div className="w-px h-10 bg-white/20 mx-1 my-auto" />
          <DockItem
            icon={Mail}
            label="Email"
            onClick={() => window.open(`mailto:${USER_DATA.social.email}`)}
            bgColor="bg-gradient-to-br from-blue-400 to-blue-600"
            iconColor="text-white"
          />
          <DockItem
            icon={Linkedin}
            label="LinkedIn"
            onClick={() =>
              window.open(`https://${USER_DATA.social.linkedin}`, '_blank')
            }
            bgColor="bg-[#0077b5]"
            iconColor="text-white"
          />
          <DockItem
            icon={Github}
            label="GitHub"
            onClick={() =>
              window.open(`https://${USER_DATA.social.github}`, '_blank')
            }
            bgColor="bg-[#1b1f23]"
            iconColor="text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default App;
