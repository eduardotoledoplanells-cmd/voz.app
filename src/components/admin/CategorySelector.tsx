'use client';

import { useState, useEffect } from 'react';
import { categoryStructure, MainCategory, SubCategory } from '@/lib/category-structure';
import { categories } from '@/lib/categories';

interface CategorySelectorProps {
    initialCategoryName?: string;
}

export default function CategorySelector({ initialCategoryName }: CategorySelectorProps) {
    const [selectedMainId, setSelectedMainId] = useState<string>('');
    const [selectedSubId, setSelectedSubId] = useState<string>('');
    const [selectedThirdId, setSelectedThirdId] = useState<string>('');
    const [selectedFourthId, setSelectedFourthId] = useState<string>('');
    const [selectedFifthId, setSelectedFifthId] = useState<string>('');
    const [finalCategoryName, setFinalCategoryName] = useState<string>('');

    // Initialize state based on initialCategoryName
    useEffect(() => {
        if (initialCategoryName) {
            for (const main of categoryStructure) {
                if (main.name === initialCategoryName) {
                    setSelectedMainId(main.id);
                    setFinalCategoryName(main.name);
                    return;
                }

                for (const sub of main.subcategories) {
                    if (sub.name === initialCategoryName) {
                        setSelectedMainId(main.id);
                        setSelectedSubId(sub.id);
                        setFinalCategoryName(sub.name);
                        return;
                    }

                    if (sub.subcategories) {
                        for (const third of sub.subcategories) {
                            if (third.name === initialCategoryName) {
                                setSelectedMainId(main.id);
                                setSelectedSubId(sub.id);
                                setSelectedThirdId(third.id);
                                setFinalCategoryName(third.name);
                                return;
                            }

                            if (third.subcategories) {
                                for (const fourth of third.subcategories) {
                                    if (fourth.name === initialCategoryName) {
                                        setSelectedMainId(main.id);
                                        setSelectedSubId(sub.id);
                                        setSelectedThirdId(third.id);
                                        setSelectedFourthId(fourth.id);
                                        setFinalCategoryName(initialCategoryName);
                                        return;
                                    }

                                    // L5 Check
                                    if (fourth.subcategories) {
                                        for (const fifth of fourth.subcategories) {
                                            if (fifth.name === initialCategoryName ||
                                                (categories.find(c => c.name === initialCategoryName)?.id === fifth.id)) {
                                                setSelectedMainId(main.id);
                                                setSelectedSubId(sub.id);
                                                setSelectedThirdId(third.id);
                                                setSelectedFourthId(fourth.id);
                                                setSelectedFifthId(fifth.id);
                                                setFinalCategoryName(initialCategoryName);
                                                return;
                                            }
                                        }
                                    }

                                    // Fallback L4 check for deep link by ID
                                    if (categories.find(c => c.name === initialCategoryName)?.id === fourth.id) {
                                        setSelectedMainId(main.id);
                                        setSelectedSubId(sub.id);
                                        setSelectedThirdId(third.id);
                                        setSelectedFourthId(fourth.id);
                                        setFinalCategoryName(initialCategoryName);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, [initialCategoryName]);

    const handleMainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mainId = e.target.value;
        setSelectedMainId(mainId);
        setSelectedSubId('');
        setSelectedThirdId('');
        setSelectedFourthId('');
        setSelectedFifthId('');

        // If main category has no subcategories, set it as final
        const mainCat = categoryStructure.find(c => c.id === mainId);
        if (mainCat && (!mainCat.subcategories || mainCat.subcategories.length === 0)) {
            setFinalCategoryName(mainCat.name);
        } else {
            setFinalCategoryName('');
        }
    };

    const handleSubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subId = e.target.value;
        setSelectedSubId(subId);
        setSelectedThirdId('');
        setSelectedFourthId('');
        setSelectedFifthId('');

        const mainCat = categoryStructure.find(c => c.id === selectedMainId);
        const subCat = mainCat?.subcategories.find(s => s.id === subId);

        if (subCat) {
            if (subCat.subcategories && subCat.subcategories.length > 0) {
                setFinalCategoryName('');
            } else {
                // Use id for leaf nodes if they are specific (like snes-consolas)
                // Otherwise use name
                setFinalCategoryName(subCat.id.includes('-') ? subCat.id : subCat.name);
            }
        }
    };

    const handleThirdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const thirdId = e.target.value;
        setSelectedThirdId(thirdId);
        setSelectedFourthId('');
        setSelectedFifthId('');

        const mainCat = categoryStructure.find(c => c.id === selectedMainId);
        const subCat = mainCat?.subcategories.find(s => s.id === selectedSubId);
        const thirdCat = subCat?.subcategories?.find(t => t.id === thirdId);

        if (thirdCat) {
            if (thirdCat.subcategories && thirdCat.subcategories.length > 0) {
                setFinalCategoryName('');
            } else {
                setFinalCategoryName(thirdCat.id.includes('-') && !thirdCat.id.startsWith('gameboy-') ? thirdCat.id : thirdCat.name);
                // Special case for Gameboy structure in category-structure vs page logic if needed, 
                // but generally ID is safer if page.tsx knows it.
                // For safety with existing page logic, we might need to be careful.
                // Let's force ID if it looks like a compound key (contains -)
                // EXCEPT for "Nintendo Game Boy" which page.tsx expects as Name? 
                // Actually page.tsx expects "Nintendo Game Boy" for the Hub, but "gameboy-consolas" (maybe?) for leaf?
            }
            // Better logic: Always prefer ID for deep nested items to avoid "Consolas" ambiguity
            setFinalCategoryName(thirdCat.id);
        }
    };

    const handleFourthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fourthId = e.target.value;
        setSelectedFourthId(fourthId);
        setSelectedFifthId('');

        const mainCat = categoryStructure.find(c => c.id === selectedMainId);
        const subCat = mainCat?.subcategories.find(s => s.id === selectedSubId);
        const thirdCat = subCat?.subcategories?.find(t => t.id === selectedThirdId);
        const fourthCat = thirdCat?.subcategories?.find(f => f.id === fourthId);

        if (fourthCat) {
            if (fourthCat.subcategories && fourthCat.subcategories.length > 0) {
                setFinalCategoryName('');
            } else {
                setFinalCategoryName(fourthCat.id);
            }
        }
    };

    const handleFifthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fifthId = e.target.value;
        setSelectedFifthId(fifthId);
        setFinalCategoryName(fifthId);
    };

    const selectedMainCategory = categoryStructure.find(c => c.id === selectedMainId);
    const selectedSubCategory = selectedMainCategory?.subcategories.find(s => s.id === selectedSubId);
    const selectedThirdCategory = selectedSubCategory?.subcategories?.find(t => t.id === selectedThirdId);
    const selectedFourthCategory = selectedThirdCategory?.subcategories?.find(f => f.id === selectedFourthId);

    const hasThirdLevel = selectedSubCategory?.subcategories && selectedSubCategory.subcategories.length > 0;
    const hasFourthLevel = selectedThirdCategory?.subcategories && selectedThirdCategory.subcategories.length > 0;
    const hasFifthLevel = selectedFourthCategory?.subcategories && selectedFourthCategory.subcategories.length > 0;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {/* Hidden input to store the actual value for the form */}
            <input type="hidden" name="category" value={finalCategoryName} />

            <div style={{ flex: '1 1 calc(50% - 15px)', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Categoría Principal</label>
                <select
                    value={selectedMainId}
                    onChange={handleMainChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    required
                >
                    <option value="">Selecciona una categoría principal</option>
                    {categoryStructure.map(main => (
                        <option key={main.id} value={main.id}>{main.name}</option>
                    ))}
                </select>
            </div>

            {selectedMainId && selectedMainCategory?.subcategories && selectedMainCategory.subcategories.length > 0 && (
                <div style={{ flex: '1 1 calc(50% - 15px)', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Subcategoría</label>
                    <select
                        value={selectedSubId}
                        onChange={handleSubChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    >
                        <option value="">Selecciona una subcategoría</option>
                        {selectedMainCategory.subcategories.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {selectedSubId && hasThirdLevel && (
                <div style={{ flex: '1 1 calc(50% - 15px)', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Sección</label>
                    <select
                        value={selectedThirdId}
                        onChange={handleThirdChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    >
                        <option value="">Selecciona una sección</option>
                        {selectedSubCategory.subcategories!.map(third => (
                            <option key={third.id} value={third.id}>{third.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {selectedThirdId && hasFourthLevel && (
                <div style={{ flex: '1 1 calc(50% - 15px)', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Tipo</label>
                    <select
                        value={selectedFourthId}
                        onChange={handleFourthChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    >
                        <option value="">Selecciona un tipo</option>
                        {selectedThirdCategory.subcategories!.map(fourth => (
                            <option key={fourth.id} value={fourth.id}>{fourth.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {selectedFourthId && hasFifthLevel && (
                <div style={{ flex: '1 1 calc(50% - 15px)', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Subtipo / Detalle</label>
                    <select
                        value={selectedFifthId}
                        onChange={handleFifthChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    >
                        <option value="">Selecciona una opción</option>
                        {selectedFourthCategory.subcategories!.map(fifth => (
                            <option key={fifth.id} value={fifth.id}>{fifth.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
