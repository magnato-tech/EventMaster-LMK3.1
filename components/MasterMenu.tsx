
import React, { useState } from 'react';
import { AppState, EventTemplate, ServiceRole, GroupCategory, UUID, ProgramItem, Assignment } from '../types';
import { Settings, Plus, Info, Edit3, Trash2, Shield, Repeat, X, Clock, Users, Edit2, Library, ListChecks } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
  onCreateRecurring: (templateId: string, startDate: string, count: number, intervalDays: number) => void;
  onAddProgramItem: (item: ProgramItem) => void;
  onUpdateProgramItem?: (id: string, updates: Partial<ProgramItem>) => void;
  onDeleteProgramItem: (id: string) => void;
}

const MasterMenu: React.FC<Props> = ({ db, setDb, onCreateRecurring, onAddProgramItem, onUpdateProgramItem, onDeleteProgramItem }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(db.eventTemplates[0] || null);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [viewingRoleInstructionsId, setViewingRoleInstructionsId] = useState<UUID | null>(null);
  const [editingProgramItem, setEditingProgramItem] = useState<ProgramItem | null>(null);

  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateType, setNewTemplateType] = useState('Gudstjeneste');
  const [newTemplateRecurrence, setNewTemplateRecurrence] = useState('Hver søndag');

  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recCount, setRecCount] = useState(4);
  const [recInterval, setRecInterval] = useState(7);

  const [progTitle, setProgTitle] = useState('');
  const [progDuration, setProgDuration] = useState(5);
  const [progRoleId, setProgRoleId] = useState<string>('');
  const [progGroupId, setProgGroupId] = useState<string>('');

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) return;

    const newTemplate: EventTemplate = {
      id: crypto.randomUUID(),
      title: newTemplateTitle,
      type: newTemplateType,
      recurrence_rule: newTemplateRecurrence
    };

    setDb(prev => ({
      ...prev,
      eventTemplates: [...prev.eventTemplates, newTemplate]
    }));

    setNewTemplateTitle('');
    setIsTemplateModalOpen(false);
    setSelectedTemplate(newTemplate);
  };

  const handleOpenAddModal = () => {
    setEditingProgramItem(null);
    setProgTitle('');
    setProgDuration(5);
    setProgRoleId('');
    setProgGroupId('');
    setIsProgramModalOpen(true);
  };

  const handleOpenEditModal = (item: ProgramItem) => {
    setEditingProgramItem(item);
    setProgTitle(item.title);
    setProgDuration(item.duration_minutes);
    setProgRoleId(item.service_role_id || '');
    setProgGroupId(item.group_id || '');
    setIsProgramModalOpen(true);
  };

  const handleSaveProgramItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !progTitle.trim()) return;

    if (editingProgramItem) {
      setDb(prev => ({
        ...prev,
        programItems: prev.programItems.map(p => p.id === editingProgramItem.id ? {
          ...p,
          title: progTitle,
          duration_minutes: progDuration,
          service_role_id: progRoleId || null,
          group_id: progGroupId || null
        } : p)
      }));
    } else {
      const items = db.programItems.filter(p => p.template_id === selectedTemplate.id);
      const newItem: ProgramItem = {
        id: crypto.randomUUID(),
        template_id: selectedTemplate.id,
        title: progTitle,
        duration_minutes: progDuration,
        service_role_id: progRoleId || null,
        group_id: progGroupId || null,
        order: items.length
      };
      onAddProgramItem(newItem);
    }

    setProgTitle('');
    setIsProgramModalOpen(false);
    setEditingProgramItem(null);
  };

  const handleAddMasterRole = (roleId: UUID) => {
    if (!selectedTemplate) return;
    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      template_id: selectedTemplate.id,
      occurrence_id: null,
      service_role_id: roleId,
      person_id: null
    };
    setDb(prev => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment]
    }));
    setIsAddRoleModalOpen(false);
  };

  const handleDeleteAssignment = (id: UUID) => {
    if (!confirm('Vil du fjerne denne vakt-rollen fra master-malen?')) return;
    setDb(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.id !== id)
    }));
  };

  const handlePlanRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    onCreateRecurring(selectedTemplate.id, recStartDate, recCount, recInterval);
    setIsRecurringModalOpen(false);
  };

  const handleDeleteTemplate = (id: UUID) => {
    if (!confirm('Er du sikker på at du vil slette denne master-malen? Dette sletter ikke eksisterende hendelser i kalenderen.')) return;
    setDb(prev => ({
      ...prev,
      eventTemplates: prev.eventTemplates.filter(t => t.id !== id)
    }));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(db.eventTemplates.filter(t => t.id !== id)[0] || null);
    }
  };

  const instructionRole = db.serviceRoles.find(sr => sr.id === viewingRoleInstructionsId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Settings className="text-amber-500" size={28} />
            Master-meny <span className="text-amber-500 font-normal">(Gul sone)</span>
          </h2>
          <p className="text-slate-500">Administrer menighetens arrangement-maler og grunnoppsett.</p>
        </div>
        <button 
          onClick={() => setIsTemplateModalOpen(true)}
          className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Ny Master-mal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left">
        <aside className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Valgt Mal</h3>
          {db.eventTemplates.map(t => (
            <button 
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className={`w-full text-left px-5 py-4 rounded-2xl transition-all border ${selectedTemplate?.id === t.id ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}`}
            >
              <p className="font-bold text-sm">{t.title}</p>
              <p className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">{t.recurrence_rule}</p>
            </button>
          ))}
        </aside>

        <main className="lg:col-span-3 space-y-6">
          {selectedTemplate ? (
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
              <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-bold text-amber-900">{selectedTemplate.title}</h4>
                  <p className="text-amber-700/60 font-medium">Denne malen brukes som "oppskrift" for nye hendelser.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsRecurringModalOpen(true)}
                    className="p-3 bg-white rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2 font-bold text-sm"
                  >
                    <Repeat size={18} /> Planlegg Serie
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="p-3 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-10">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Clock size={18} className="text-indigo-500" />
                      Standard Kjøreplan
                    </h5>
                    <button 
                      onClick={handleOpenAddModal}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Ny Aktivitet
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {db.programItems
                      .filter(p => p.template_id === selectedTemplate.id)
                      .sort((a, b) => a.order - b.order)
                      .map((item, idx) => {
                        const role = db.serviceRoles.find(r => r.id === item.service_role_id);
                        const group = db.groups.find(g => g.id === item.group_id);
                        return (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl group">
                            <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{item.title}</p>
                              <div className="flex gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock size={10} /> {item.duration_minutes} min
                                </span>
                                {role && (
                                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Shield size={10} /> {role.name}
                                  </span>
                                )}
                                {group && (
                                  <span className="text-[10px] text-teal-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Users size={10} /> {group.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-colors">
                              <button 
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => onDeleteProgramItem(item.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {db.programItems.filter(p => p.template_id === selectedTemplate.id).length === 0 && (
                      <p className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 border border-dashed rounded-2xl">Ingen aktiviteter definert i kjøreplanen.</p>
                    )}
                  </div>
                </section>

                <hr className="border-slate-100" />

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Shield size={18} className="text-indigo-500" />
                      Standard Bemanning (Vaktliste)
                    </h5>
                    <button 
                      onClick={() => setIsAddRoleModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Legg til rolle
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {db.assignments
                      .filter(a => a.template_id === selectedTemplate.id)
                      .map(assign => {
                        const role = db.serviceRoles.find(r => r.id === assign.service_role_id);
                        return (
                          <div 
                            key={assign.id} 
                            onClick={() => setViewingRoleInstructionsId(role?.id || null)}
                            className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Shield size={16} />
                              </div>
                              <span className="font-semibold text-slate-700">{role?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Info size={14} className="text-slate-300" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assign.id); }}
                                className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {db.assignments.filter(a => a.template_id === selectedTemplate.id).length === 0 && (
                      <p className="col-span-full text-center py-6 text-slate-400 text-xs italic bg-slate-50 border border-dashed rounded-2xl">Ingen vakter lagt til i denne malen.</p>
                    )}
                  </div>
                </section>

                <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl flex gap-4">
                  <div className="mt-1"><Info size={20} className="text-amber-400" /></div>
                  <div className="text-sm">
                    <p className="font-bold text-white mb-1">Snapshot-logikk</p>
                    <p className="leading-relaxed">Endringer du gjør i malen vil <strong>ikke</strong> påvirke eksisterende hendelser i kalenderen. Kun nye hendelser vil arve dette oppsettet.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-100 border-2 border-dashed rounded-3xl text-slate-400">
              <p>Opprett eller velg en mal for å starte planleggingen.</p>
            </div>
          )}
        </main>
      </div>

      {/* Instruks-Modal */}
      {viewingRoleInstructionsId && instructionRole && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingRoleInstructionsId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 text-left max-h-[80vh] flex flex-col">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Library size={24} />
                <div>
                  <h3 className="text-lg font-bold leading-none">{instructionRole.name}</h3>
                  <p className="text-xs text-indigo-200 mt-1 uppercase tracking-widest font-bold">Rolle-instruks fra katalogen</p>
                </div>
              </div>
              <button onClick={() => setViewingRoleInstructionsId(null)} className="p-1 hover:bg-indigo-600 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {instructionRole.description && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Beskrivelse</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{instructionRole.description}</p>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ListChecks size={14}/> Sjekkliste for tjenesten
                </h4>
                <div className="space-y-3">
                  {instructionRole.default_instructions.map((inst, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-400">{i+1}</div>
                      {inst}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 shrink-0 flex justify-end">
              <button onClick={() => setViewingRoleInstructionsId(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs">Lukk</button>
            </div>
          </div>
        </div>
      )}

      {/* Velg fra katalog modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddRoleModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-left animate-in zoom-in-95">
            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-tight">Legg til rolle i mal</h3>
              <button onClick={() => setIsAddRoleModalOpen(false)}><X size={18}/></button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {db.serviceRoles.map(sr => (
                <button 
                  key={sr.id} 
                  onClick={() => handleAddMasterRole(sr.id)} 
                  className="w-full p-4 rounded-xl border text-left flex justify-between items-center hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <div className="font-bold text-slate-800 text-sm">{sr.name}</div>
                  <Plus size={16} className="text-indigo-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isProgramModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsProgramModalOpen(false); setEditingProgramItem(null); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingProgramItem ? 'Rediger Aktivitet' : 'Ny Aktivitet'}</h3>
              <button onClick={() => { setIsProgramModalOpen(false); setEditingProgramItem(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveProgramItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tittel / Hva skjer?</label>
                <input autoFocus required type="text" value={progTitle} onChange={e => setProgTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="f.eks. Åpning & Velkomst" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Varighet (minutter)</label>
                <input required type="number" min="1" value={progDuration} onChange={e => setProgDuration(parseInt(e.target.value) || 5)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Knytt til Rolle (Katalog)</label>
                  <select value={progRoleId} onChange={e => { setProgRoleId(e.target.value); if(e.target.value) setProgGroupId(''); }} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
                    <option value="">Ingen valgt</option>
                    {db.serviceRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Knytt til Team (Gruppe)</label>
                  <select value={progGroupId} onChange={e => { setProgGroupId(e.target.value); if(e.target.value) setProgRoleId(''); }} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
                    <option value="">Ingen valgt</option>
                    {db.groups.filter(g => g.category === GroupCategory.SERVICE).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                {editingProgramItem ? 'Oppdater' : 'Legg til i kjøreplan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTemplateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Ny Master-mal</h3>
              <button onClick={() => setIsTemplateModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Navn på mal</label>
                <input autoFocus required type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all" placeholder="f.eks. Lovsangsmøte" />
              </div>
              <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg hover:bg-amber-600 transition-all">Opprett Master</button>
            </form>
          </div>
        </div>
      )}

      {isRecurringModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-xl" onClick={() => setIsRecurringModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Repeat size={20} /> Planlegg serie</h3>
              <button onClick={() => setIsRecurringModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handlePlanRecurring} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bruker mal:</p>
                <p className="text-sm font-bold text-slate-800">{selectedTemplate.title}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Startdato</label>
                <input required type="date" value={recStartDate} onChange={e => setRecStartDate(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Antall ganger</label>
                  <input required type="number" min="1" max="52" value={recCount} onChange={e => setRecCount(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Intervall (dager)</label>
                  <input required type="number" min="1" value={recInterval} onChange={e => setRecInterval(parseInt(e.target.value) || 7)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Start planlegging</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterMenu;
