import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Category } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string, parentId?: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryManager({ 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const mainCategories = categories.filter(c => !c.parentId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('CategoryManager: handleAdd triggered', { newCategoryName, selectedParentId });
    if (!newCategoryName.trim()) {
      console.warn('CategoryManager: Category name is empty');
      return;
    }
    onAddCategory(newCategoryName.trim(), selectedParentId || undefined);
    setNewCategoryName('');
    setSelectedParentId('');
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    onUpdateCategory(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900">New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="parentCategory" className="text-[10px] font-bold uppercase text-zinc-400">Parent (Optional)</Label>
                <Select
                  id="parentCategory"
                  className="h-9 text-xs"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">Main Category</option>
                  {mainCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryName" className="text-[10px] font-bold uppercase text-zinc-400">Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="categoryName"
                    className="h-9 text-xs"
                    placeholder="e.g. Supplements"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Button type="submit" className="h-9 px-4 text-xs font-bold uppercase tracking-wider">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900">Category Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Structure</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mainCategories.map((mainCat) => {
                const subCats = categories.filter(c => c.parentId === mainCat.id);
                return (
                  <React.Fragment key={mainCat.id}>
                    <TableRow className="bg-zinc-50/30 border-zinc-50">
                      <TableCell className="py-3">
                        {editingId === mainCat.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 text-xs max-w-[200px]"
                          />
                        ) : (
                          <span className="text-xs font-bold text-zinc-900 uppercase tracking-tight">{mainCat.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {editingId === mainCat.id ? (
                            <Button size="sm" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold text-zinc-400 hover:text-zinc-900"
                                onClick={() => {
                                  setSelectedParentId(mainCat.id);
                                  document.getElementById('categoryName')?.focus();
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Sub
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-zinc-400 hover:text-zinc-900"
                                onClick={() => handleStartEdit(mainCat)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-red-500"
                            onClick={() => onDeleteCategory(mainCat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {subCats.map(subCat => (
                      <TableRow key={subCat.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="pl-8 py-2">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-zinc-300" />
                            {editingId === subCat.id ? (
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-8 text-xs max-w-[200px]"
                              />
                            ) : (
                              <span className="text-xs font-medium text-zinc-600">{subCat.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {editingId === subCat.id ? (
                              <Button size="sm" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-zinc-400 hover:text-zinc-900"
                                onClick={() => handleStartEdit(subCat)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-zinc-400 hover:text-red-500"
                              onClick={() => onDeleteCategory(subCat.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12 text-zinc-400 text-xs">
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
