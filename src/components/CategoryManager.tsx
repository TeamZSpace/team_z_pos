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
      <Card>
        <CardHeader>
          <CardTitle>Add New Category or Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
                <Select
                  id="parentCategory"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">Main Category (None)</option>
                  {mainCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="categoryName"
                    placeholder="e.g., Supplements, Face Care"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories & Subcategories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Structure</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mainCategories.map((mainCat) => {
                const subCats = categories.filter(c => c.parentId === mainCat.id);
                return (
                  <React.Fragment key={mainCat.id}>
                    {/* Main Category Row */}
                    <TableRow className="bg-zinc-50/50">
                      <TableCell className="font-bold">
                        {editingId === mainCat.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="max-w-[200px]"
                          />
                        ) : (
                          mainCat.name
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {editingId === mainCat.id ? (
                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-zinc-500 hover:text-zinc-900"
                                onClick={() => {
                                  setSelectedParentId(mainCat.id);
                                  document.getElementById('categoryName')?.focus();
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Sub
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleStartEdit(mainCat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600"
                            onClick={() => onDeleteCategory(mainCat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Subcategories Rows */}
                    {subCats.map(subCat => (
                      <TableRow key={subCat.id}>
                        <TableCell className="pl-10 flex items-center justify-center gap-2">
                          <ChevronRight className="h-3 w-3 text-zinc-400" />
                          {editingId === subCat.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="max-w-[200px]"
                            />
                          ) : (
                            subCat.name
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            {editingId === subCat.id ? (
                              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleStartEdit(subCat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => onDeleteCategory(subCat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                  <TableCell colSpan={2} className="text-center py-8 text-zinc-500">
                    No categories added yet.
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
