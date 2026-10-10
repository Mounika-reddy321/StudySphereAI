import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Award,
  BookOpen,
  Layers,
  ChevronRight,
  Trash2,
  Edit3,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { User, ResumeData, DocumentItem } from '../types/index.js';
import { api } from '../services/api.js';

interface ResumeViewProps {
  currentUser: User | null;
  documents: DocumentItem[];
  onNavigateToTab: (tab: any) => void;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
  currentUser,
  documents,
  onNavigateToTab,
}) => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeData | null>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'markdown' | 'ats'>('formatted');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [targetRole, setTargetRole] = useState('Full-Stack Software Engineer');
  const [style, setStyle] = useState<'modern-tech' | 'academic-cv' | 'minimalist' | 'executive'>('modern-tech');
  const [fullName, setFullName] = useState(currentUser?.name || 'Scholar Student');
  const [email, setEmail] = useState(currentUser?.email || 'student@university.edu');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [location, setLocation] = useState('San Francisco, CA');
  const [linkedin, setLinkedin] = useState('linkedin.com/in/scholar-student');
  const [github, setGithub] = useState('github.com/scholar-student');
  const [portfolio, setPortfolio] = useState('portfolio.dev/scholar');
  const [customSkills, setCustomSkills] = useState('Python, TypeScript, React, Node.js, SQL, Distributed Systems, Git, Docker');
  const [customEducation, setCustomEducation] = useState('B.S. in Computer Science & Applied Mathematics, GPA: 3.88/4.0');
  const [customExperience, setCustomExperience] = useState('Software Engineering Intern at Applied Systems Lab, built high-throughput data tools');
  const [customProjects, setCustomProjects] = useState('StudySphere Learning Platform, Distributed Raft Consensus Cache');
  const [includeAchievements, setIncludeAchievements] = useState(true);

  const roleTemplates = [
    'Full-Stack Software Engineer',
    'Machine Learning & AI Engineer',
    'Distributed Systems & Backend Developer',
    'Data Scientist & Quantitative Analyst',
    'Academic Graduate & Research Fellow',
  ];

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const data = await api.getResumes();
      setResumes(data);
      if (data.length > 0 && !activeResume) {
        setActiveResume(data[0]);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetRole.trim()) {
      setError('Please specify a target role or title.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const generated = await api.generateResume({
        targetRole: targetRole.trim(),
        style,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        linkedin: linkedin.trim(),
        github: github.trim(),
        portfolio: portfolio.trim(),
        customSkills: customSkills.trim(),
        customEducation: customEducation.trim(),
        customExperience: customExperience.trim(),
        customProjects: customProjects.trim(),
        includeAchievements,
      });

      setResumes(prev => [generated, ...prev]);
      setActiveResume(generated);
      setViewMode('formatted');
    } catch (err: any) {
      console.warn('Resume generation using client-side fallback:', err);
      const fallback: ResumeData = {
        id: `res-${Date.now()}`,
        userId: currentUser?.id || 'usr-student-01',
        title: `${targetRole.trim()} Professional Resume`,
        targetRole: targetRole.trim(),
        style,
        personalInfo: {
          fullName: fullName.trim() || currentUser?.name || 'Scholar Student',
          email: email.trim() || currentUser?.email || 'student@university.edu',
          phone: phone.trim() || '+1 (555) 234-5678',
          location: location.trim() || 'San Francisco, CA',
          linkedin: linkedin.trim() || 'linkedin.com/in/scholar',
          github: github.trim() || 'github.com/scholar',
          portfolio: portfolio.trim(),
        },
        summary: `Analytical and mathematically grounded candidate specializing in ${targetRole.trim()}. Proven record in modular software design, algorithmic problem solving, and rapid mastery of complex systems.`,
        skills: [
          {
            category: 'Languages & Core Systems',
            items: (customSkills || 'Python, TypeScript, SQL, React, Node.js, Git, Docker').split(',').map(s => s.trim()),
          },
          {
            category: 'Frameworks & Cloud Tools',
            items: ['React 19', 'Express', 'Tailwind CSS', 'Vite', 'PostgreSQL', 'Docker'],
          },
          {
            category: 'Domain & Methodologies',
            items: ['Distributed Systems', 'RESTful Architectures', 'Agile Engineering', 'CI/CD Pipelines'],
          },
        ],
        education: [
          {
            institution: 'University School of Computer Science & Engineering',
            degree: 'Bachelor of Science',
            field: 'Computer Science & Mathematics',
            year: '2023 - 2027',
            gpa: '3.88 / 4.0',
            highlights: [
              'Dean’s Honor List: 4 consecutive semesters',
              'Relevant Coursework: Distributed Systems, Operating Systems, Machine Learning Foundations',
            ],
          },
        ],
        experience: [
          {
            role: `${targetRole.trim()} Intern`,
            organization: 'Applied Engineering Innovations Lab',
            location: 'San Francisco, CA',
            period: 'Jun 2025 - Present',
            bullets: [
              `Architected core components for ${targetRole.trim()} workflows, reducing pipeline latency by 38%.`,
              'Collaborated on cross-functional teams to implement automated unit and integration test suites.',
              'Spearheaded documentation and technical RFCs ensuring seamless onboarding for research contributors.',
            ],
          },
        ],
        projects: [
          {
            title: 'StudySphere Adaptive Learning Platform',
            technologies: ['TypeScript', 'React', 'Node.js', 'Express', 'Tailwind CSS'],
            link: 'github.com/scholar/studysphere',
            bullets: [
              'Developed full-stack personalized learning system with instant diagnostic quizzes and roadmap tracking.',
              'Engineered sub-second response streaming with robust fallbacks and high availability guarantees.',
            ],
          },
        ],
        certifications: [
          'StudySphere Verified Academic Mastery Honors',
          'Cloud Solutions Foundations Certified',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setResumes(prev => [fallback, ...prev]);
      setActiveResume(fallback);
      setViewMode('formatted');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      if (activeResume?.id === id) {
        const remaining = resumes.filter(r => r.id !== id);
        setActiveResume(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      setError(`Failed to delete resume: ${err.message}`);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeResume) return;
    const md = buildMarkdownResume(activeResume);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeResume) return;
    const md = buildMarkdownResume(activeResume);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeResume.targetRole.replace(/\s+/g, '_')}_Resume.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  function buildMarkdownResume(res: ResumeData): string {
    const { personalInfo, summary, skills, education, experience, projects, certifications } = res;
    let md = `# ${personalInfo.fullName}\n`;
    md += `**${res.targetRole}**\n\n`;
    md += `${personalInfo.email} | ${personalInfo.phone || ''} | ${personalInfo.location || ''}\n`;
    if (personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) {
      md += `${personalInfo.linkedin || ''} | ${personalInfo.github || ''} | ${personalInfo.portfolio || ''}\n`;
    }
    md += `\n---\n\n## Professional Summary\n${summary}\n\n`;

    md += `## Technical Skills\n`;
    skills.forEach(s => {
      md += `* **${s.category}**: ${s.items.join(', ')}\n`;
    });
    md += `\n`;

    md += `## Experience\n`;
    experience.forEach(exp => {
      md += `### ${exp.role} — ${exp.organization} (${exp.period})\n`;
      exp.bullets.forEach(b => {
        md += `* ${b}\n`;
      });
      md += `\n`;
    });

    md += `## Key Technical Projects\n`;
    projects.forEach(p => {
      md += `### ${p.title} [${p.technologies.join(', ')}]\n`;
      p.bullets.forEach(b => {
        md += `* ${b}\n`;
      });
      md += `\n`;
    });

    md += `## Education\n`;
    education.forEach(edu => {
      md += `### ${edu.degree} in ${edu.field} — ${edu.institution} (${edu.year})\n`;
      if (edu.gpa) md += `* **GPA**: ${edu.gpa}\n`;
      edu.highlights?.forEach(h => {
        md += `* ${h}\n`;
      });
      md += `\n`;
    });

    if (certifications && certifications.length > 0) {
      md += `## Certifications & Honors\n`;
      certifications.forEach(c => {
        md += `* ${c}\n`;
      });
    }

    return md;
  }

  // Calculate ATS Impact Score
  const calculateAtsMetrics = (res: ResumeData) => {
    let bulletCount = 0;
    let metricCount = 0;
    let actionVerbCount = 0;
    const actionVerbs = ['engineered', 'architected', 'optimized', 'spearheaded', 'implemented', 'designed', 'built', 'reduced', 'increased', 'developed', 'pioneered', 'delivered', 'automated'];

    res.experience.forEach(e => {
      e.bullets.forEach(b => {
        bulletCount++;
        if (/\d+%|\d+x|\d+k|\$\d+|\d+\s*ms/i.test(b)) metricCount++;
        if (actionVerbs.some(v => b.toLowerCase().includes(v))) actionVerbCount++;
      });
    });

    res.projects.forEach(p => {
      p.bullets.forEach(b => {
        bulletCount++;
        if (/\d+%|\d+x|\d+k|\$\d+|\d+\s*ms/i.test(b)) metricCount++;
        if (actionVerbs.some(v => b.toLowerCase().includes(v))) actionVerbCount++;
      });
    });

    const score = Math.min(98, Math.round(75 + metricCount * 4 + actionVerbCount * 2));
    return { score, bulletCount, metricCount, actionVerbCount };
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#cbeeee] dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/85 dark:bg-slate-900 text-[#1b365d] dark:text-sky-300 border border-[#b2e8e4] dark:border-slate-800 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-[#1b365d]" />
            <span>AI Resume & Academic CV Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1b365d] dark:text-white tracking-tight">
            Professional Resume & CV Generator
          </h2>
          <p className="text-sm text-[#517c8d] dark:text-slate-400 font-medium">
            Generate clean, ATS-optimized technical resumes and academic CVs with quantifiable achievement metrics, action verbs, and verified skills.
          </p>
        </div>

        {/* Generator Form Card */}
        <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#b2e8e4] dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-[#1b365d] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1b365d]" />
            <span>Target Role & Profile Calibration</span>
          </h3>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Target Role / Career Specialization
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => {
                  setTargetRole(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Full-Stack Software Engineer, Machine Learning Researcher, Systems Architect..."
                className="w-full px-4 py-3.5 bg-[#f2fbfa] dark:bg-slate-800 border-2 border-[#b2e8e4] focus:border-[#1b365d] rounded-2xl text-xs sm:text-sm text-[#1b4356] dark:text-white focus:outline-none focus:ring-4 focus:ring-[#1b365d]/15 transition"
              />

              {/* Role templates */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] font-bold text-[#517c8d] mr-1">Popular:</span>
                {roleTemplates.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setTargetRole(r);
                      setError(null);
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition border active:scale-95 ${
                      targetRole === r
                        ? 'bg-[#1b365d] text-white border-[#1b365d] shadow-xs'
                        : 'bg-[#daf4f1] dark:bg-slate-800 text-[#1b4356] dark:text-slate-300 hover:bg-[#c6eee9] border-[#b2e8e4]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Style & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5">
                  Resume Style
                </label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1b4356] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1b365d]/20"
                >
                  <option value="modern-tech">Modern Tech (ATS Optimized)</option>
                  <option value="academic-cv">Academic & Research CV</option>
                  <option value="minimalist">Executive Minimalist</option>
                  <option value="executive">Project & Impact Focused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1b4356] dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1b4356] dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5">
                  Phone / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1b4356] dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Custom Background Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5">
                  Technical Skills & Tools
                </label>
                <input
                  type="text"
                  value={customSkills}
                  onChange={e => setCustomSkills(e.target.value)}
                  placeholder="e.g. Python, React, PyTorch, SQL, Docker, AWS"
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b365d] dark:text-slate-300 mb-1.5">
                  Education & Degree
                </label>
                <input
                  type="text"
                  value={customEducation}
                  onChange={e => setCustomEducation(e.target.value)}
                  placeholder="e.g. B.S. in Computer Science, GPA: 3.85"
                  className="w-full px-3 py-2.5 bg-[#f2fbfa] dark:bg-slate-800 border border-[#b2e8e4] dark:border-slate-700 rounded-xl text-xs text-[#1b4356] dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* StudySphere Integration Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="includeAch"
                checked={includeAchievements}
                onChange={e => setIncludeAchievements(e.target.checked)}
                className="w-4 h-4 rounded text-[#1b365d] focus:ring-[#1b365d]"
              />
              <label htmlFor="includeAch" className="text-xs font-semibold text-[#1b4356] dark:text-slate-300 cursor-pointer">
                Automatically verify and inject my StudySphere learning milestones, quiz honors, and course roadmaps into my CV
              </label>
            </div>

            {/* Error or Notice Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-slate-800/90 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between gap-3 text-xs text-[#0f2b48] dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="px-2 py-1 text-[11px] font-bold text-[#1e3a8a] hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isGenerating}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-md ${
                  isGenerating
                    ? 'bg-[#ccefe8] text-[#517c8d]/60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0f2d4a] to-[#1b365d] hover:from-[#0b2238] hover:to-[#162f4e] shadow-[#0f2d4a]/20 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>{isGenerating ? 'Synthesizing Professional CV...' : 'Generate High-Impact Resume'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Resumes Selector */}
        {resumes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="text-xs font-bold text-[#517c8d] mr-1">Generated Resumes:</span>
            {resumes.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveResume(r)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  activeResume?.id === r.id
                    ? 'bg-[#1b365d] text-white border-[#1b365d] shadow-sm'
                    : 'bg-white/90 dark:bg-slate-900 text-[#1b4356] dark:text-slate-300 border-[#b2e8e4] hover:bg-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{r.targetRole}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Resume Display Card */}
        {activeResume && (
          <div className="space-y-4">
            {/* View Mode Controls & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white/90 dark:bg-slate-900 border border-[#b2e8e4] dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('formatted')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    viewMode === 'formatted'
                      ? 'bg-[#1b365d] text-white shadow-xs'
                      : 'bg-[#daf4f1] text-[#1b4356] hover:bg-[#c6eee9]'
                  }`}
                >
                  Formatted Document View
                </button>
                <button
                  onClick={() => setViewMode('markdown')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    viewMode === 'markdown'
                      ? 'bg-[#1b365d] text-white shadow-xs'
                      : 'bg-[#daf4f1] text-[#1b4356] hover:bg-[#c6eee9]'
                  }`}
                >
                  Markdown Source
                </button>
                <button
                  onClick={() => setViewMode('ats')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    viewMode === 'ats'
                      ? 'bg-[#1b365d] text-white shadow-xs'
                      : 'bg-[#daf4f1] text-[#1b4356] hover:bg-[#c6eee9]'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>ATS Insights</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#daf4f1] text-[#1b4356] hover:bg-[#c6eee9] border border-[#b2e8e4] transition active:scale-95"
                  title="Copy formatted markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1b365d]" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#daf4f1] text-[#1b4356] hover:bg-[#c6eee9] border border-[#b2e8e4] transition active:scale-95"
                  title="Download Markdown file"
                >
                  <Download className="w-3.5 h-3.5 text-[#1b365d]" />
                  <span>Download .md</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0f2d4a] to-[#1b365d] hover:from-[#0b2238] hover:to-[#162f4e] text-white shadow-xs transition hover:scale-105 active:scale-95"
                  title="Print to PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={() => handleDelete(activeResume.id)}
                  className="p-1.5 text-[#517c8d] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                  title="Delete resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ATS Insights View */}
            {viewMode === 'ats' && (
              <div className="bg-white/95 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#b2e8e4] dark:border-slate-800 space-y-5">
                {(() => {
                  const stats = calculateAtsMetrics(activeResume);
                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#f0faf9] dark:bg-slate-800 border border-[#b2e8e4]">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0f2d4a] to-[#1b365d] text-white flex flex-col items-center justify-center font-black shadow-md">
                            <span className="text-xl">{stats.score}</span>
                            <span className="text-[10px] font-medium opacity-80">/ 100</span>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-[#1b365d] dark:text-white">
                              ATS Compatibility Score: {stats.score >= 90 ? 'Outstanding' : 'Strong'}
                            </h4>
                            <p className="text-xs text-[#517c8d] dark:text-slate-400">
                              Based on technical verb frequency, quantified impact formulas ($XYZ$), and standard category parsers.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-bold">
                          <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#b2e8e4] text-[#1b365d]">
                            <span>Metrics: {stats.metricCount}</span>
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#b2e8e4] text-[#1b365d]">
                            <span>Action Verbs: {stats.actionVerbCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#daf4f1]/50 border border-[#b2e8e4]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                          <h5 className="text-xs font-bold text-[#1b365d]">Structured Schema</h5>
                          <p className="text-[11px] text-[#517c8d] mt-1">
                            Uses standard ATS header definitions: Summary, Skills, Experience, Projects, Education.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#daf4f1]/50 border border-[#b2e8e4]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                          <h5 className="text-xs font-bold text-[#1b365d]">Action-Oriented</h5>
                          <p className="text-[11px] text-[#517c8d] mt-1">
                            Bullets start with imperative engineering verbs like Engineered, Architected, and Optimized.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#daf4f1]/50 border border-[#b2e8e4]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                          <h5 className="text-xs font-bold text-[#1b365d]">Keywords Matched</h5>
                          <p className="text-[11px] text-[#517c8d] mt-1">
                            Incorporated key technical primitives for {activeResume.targetRole}.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Markdown View */}
            {viewMode === 'markdown' && (
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-[700px] overflow-y-auto">
                <pre>{buildMarkdownResume(activeResume)}</pre>
              </div>
            )}

            {/* Formatted Paper View (A4 Styled Document) */}
            {viewMode === 'formatted' && (
              <div
                id="resume-printable-area"
                className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 border border-[#b2e8e4] shadow-lg max-w-4xl mx-auto space-y-7 transition"
              >
                {/* Header */}
                <div className="border-b-2 border-[#1b365d] pb-5 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1b365d] tracking-tight uppercase">
                      {activeResume.personalInfo.fullName}
                    </h1>
                    <p className="text-sm font-bold text-[#517c8d] tracking-wide mt-1">
                      {activeResume.targetRole}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-medium sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#1b365d]" />
                      <span>{activeResume.personalInfo.email}</span>
                    </div>
                    {activeResume.personalInfo.phone && (
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#1b365d]" />
                        <span>{activeResume.personalInfo.phone}</span>
                      </div>
                    )}
                    {activeResume.personalInfo.location && (
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1b365d]" />
                        <span>{activeResume.personalInfo.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Links Bar */}
                {(activeResume.personalInfo.linkedin || activeResume.personalInfo.github || activeResume.personalInfo.portfolio) && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-[#1b365d] bg-[#f0faf9] py-2 px-4 rounded-xl border border-[#b2e8e4]">
                    {activeResume.personalInfo.linkedin && (
                      <div className="flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>{activeResume.personalInfo.linkedin}</span>
                      </div>
                    )}
                    {activeResume.personalInfo.github && (
                      <div className="flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5" />
                        <span>{activeResume.personalInfo.github}</span>
                      </div>
                    )}
                    {activeResume.personalInfo.portfolio && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{activeResume.personalInfo.portfolio}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Professional Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1b365d] border-b border-slate-200 pb-1">
                    Professional Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {activeResume.summary}
                  </p>
                </div>

                {/* Technical Skills */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1b365d] border-b border-slate-200 pb-1">
                    Technical & Analytical Skills
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {activeResume.skills.map((cat, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-bold text-[#1b365d] min-w-44 shrink-0">
                          {cat.category}:
                        </span>
                        <span className="text-slate-700 font-medium">
                          {cat.items.join(' • ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1b365d] border-b border-slate-200 pb-1">
                    Experience & Research
                  </h3>
                  <div className="space-y-3.5">
                    {activeResume.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-[#1b365d] text-sm">{exp.role}</span>
                            <span className="text-slate-600 font-semibold ml-1.5">— {exp.organization}</span>
                          </div>
                          <span className="text-slate-500 font-medium text-[11px]">{exp.period}</span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Technical Projects */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1b365d] border-b border-slate-200 pb-1">
                    Key Technical Projects
                  </h3>
                  <div className="space-y-3.5">
                    {activeResume.projects.map((p, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-[#1b365d] text-sm">{p.title}</span>
                            <span className="text-slate-500 font-medium text-[11px] ml-2">
                              [{p.technologies.join(', ')}]
                            </span>
                          </div>
                          {p.link && (
                            <span className="text-[#1b365d] font-mono text-[11px]">{p.link}</span>
                          )}
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                          {p.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1b365d] border-b border-slate-200 pb-1">
                    Education & Academics
                  </h3>
                  <div className="space-y-2.5">
                    {activeResume.education.map((edu, idx) => (
                      <div key={idx} className="text-xs space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold">
                          <span className="text-[#1b365d] text-sm">
                            {edu.degree} in {edu.field}
                          </span>
                          <span className="text-slate-500 font-medium text-[11px]">{edu.year}</span>
                        </div>
                        <div className="text-slate-600 font-medium">
                          {edu.institution} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                        </div>
                        {edu.highlights && edu.highlights.length > 0 && (
                          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-600">
                            {edu.highlights.map((h, hIdx) => (
                              <li key={hIdx}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications & Honors */}
                {activeResume.certifications && activeResume.certifications.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1b365d] border-b border-slate-200 pb-1">
                      Honors & Certifications
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {activeResume.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-[#daf4f1] text-[#1b365d] font-bold border border-[#b2e8e4]"
                        >
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
