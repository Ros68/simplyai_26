import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GripVertical, HelpCircle, Image } from 'lucide-react';
import ConditionalLogicEditor from '@/components/form-builder/components/ConditionalLogicEditor';

// Question types for sidebar
const QUESTION_TYPES = [
	{ type: 'text', label: 'Text' },
	{ type: 'textarea', label: 'Paragraph' },
	{ type: 'radio', label: 'Single Choice' },
	{ type: 'checkbox', label: 'Multiple Choice' },
	{ type: 'dropdown', label: 'Dropdown' },
	{ type: 'image-choice', label: 'Image Selection' },
	{ type: 'rating', label: 'Rating' },
	{ type: 'range', label: 'Range' },
	{ type: 'euro', label: 'Value in €' },
	{ type: 'table', label: 'Table' },
	{ type: 'file', label: 'File Upload' },
];

const BLOCK_TYPES = [
	...QUESTION_TYPES,
	{ type: 'text-block', label: 'Text Block' },
	{ type: 'image-block', label: 'Image' },
];

const initialPage = {
	id: 'page-1',
	title: 'Page 1',
	blocks: [], // blocks: text, image, question, etc.
};

const FormBuilderV2 = () => {
	const [pages, setPages] = useState([initialPage]);
	const [activePage, setActivePage] = useState(0);
	const [draggedType, setDraggedType] = useState(null);

	// Add new page
	const handleAddPage = () => {
		setPages(pgs => [
			...pgs,
			{ id: 'page-' + Date.now(), title: `Page ${pgs.length + 1}`, blocks: [] },
		]);
		setActivePage(pages.length);
	};

	// Page navigation
	const handlePageNav = idx => setActivePage(idx);

	// Drag handlers
	const handleDragStart = (type) => setDraggedType(type);
	const handleDrop = (e) => {
		e.preventDefault();
		if (!draggedType) return;
		let newBlock;
		if (draggedType === 'text-block') {
			newBlock = { id: 't-' + Date.now(), type: 'text-block', content: '' };
		} else if (draggedType === 'image-block') {
			newBlock = { id: 'img-' + Date.now(), type: 'image-block', url: '' };
		} else {
			newBlock = {
				id: 'q-' + Date.now(),
				type: draggedType,
				description: '',
				image: '',
				guide: '',
				lesson: '',
				answers: [{ value: '', score: 0 }],
				logic: '',
			};
		}
		setPages(pgs => {
			const updated = [...pgs];
			updated[activePage].blocks.push(newBlock);
			return updated;
		});
		setDraggedType(null);
	};

	// Add another question button
	const handleAddQuestion = (type) => {
		const newQuestion = {
			id: 'q-' + Date.now(),
			type,
			description: '',
			image: '',
			guide: '',
			lesson: '',
			answers: [{ value: '', score: 0 }],
			logic: '',
		};
		setPages(pgs => {
			const updated = [...pgs];
			updated[activePage].blocks.push(newQuestion);
			return updated;
		});
	};

	// Add text block
	const handleAddTextBlock = () => {
		setPages(pgs => {
			const updated = [...pgs];
			updated[activePage].blocks.push({ id: 't-' + Date.now(), type: 'text-block', content: '' });
			return updated;
		});
	};

	// Add image block
	const handleAddImageBlock = () => {
		setPages(pgs => {
			const updated = [...pgs];
			updated[activePage].blocks.push({ id: 'img-' + Date.now(), type: 'image-block', url: '' });
			return updated;
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Form Builder (v2)</h1>
					<p className="text-muted-foreground mt-2">Drag question types, text, or images, or use the buttons to add them</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={handleAddQuestion.bind(null, 'text')}>
						<Plus className="mr-2 h-4 w-4" /> Add Question
					</Button>
					<Button onClick={handleAddTextBlock} variant="outline">
						<Plus className="mr-2 h-4 w-4" /> Add Text
					</Button>
					<Button onClick={handleAddImageBlock} variant="outline">
						<Image className="mr-2 h-4 w-4" /> Add Image
					</Button>
				</div>
			</div>
			{/* Page navigation */}
			<div className="flex gap-2 mb-4">
				{pages.map((p, idx) => (
					<Button key={p.id} variant={activePage === idx ? 'default' : 'outline'} onClick={() => handlePageNav(idx)}>
						{p.title}
					</Button>
				))}
				<Button onClick={handleAddPage} variant="ghost">
					<Plus className="h-4 w-4" /> Add Page
				</Button>
			</div>
			<div className="flex gap-6">
				{/* Sidebar */}
				<Card className="w-64 min-w-[220px] h-fit">
					<CardHeader>
						<CardTitle>Blocks & Question Types</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						{BLOCK_TYPES.map(qt => (
							<Button
								key={qt.type}
								variant="outline"
								className="justify-start"
								draggable
								onDragStart={() => handleDragStart(qt.type)}
							>
								{qt.label}
							</Button>
						))}
					</CardContent>
				</Card>
				{/* Main Canvas */}
				<div className="flex-1" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
					<Card>
						<CardHeader>
							<CardTitle>Page: {pages[activePage].title}</CardTitle>
						</CardHeader>
						<CardContent>
							{pages[activePage].blocks.length === 0 && (
								<div className="text-gray-400">Drag a block or question type here or use the Add buttons.</div>
							)}
							<div className="flex flex-col gap-4">
								{pages[activePage].blocks.map((block, idx) => (
									<Card key={block.id} className="border bg-white">
										<CardHeader className="flex flex-row items-center gap-2 pb-2">
											<GripVertical className="text-gray-400" />
											<span className="font-medium">{block.type === 'text-block' ? 'Text' : block.type === 'image-block' ? 'Image' : block.type}</span>
											{block.type !== 'text-block' && block.type !== 'image-block' && (
												<Button size="icon" variant="ghost">
													<HelpCircle className="h-4 w-4" />
												</Button>
											)}
										</CardHeader>
										<CardContent className="pt-0">
											{block.type === 'text-block' && (
												<div className="mb-2">
													<Label>Text</Label>
													<Input placeholder="Text content..." value={block.content} onChange={e => {
														setPages(pgs => {
															const updated = [...pgs];
															updated[activePage].blocks[idx].content = e.target.value;
															return updated;
														});
													}} />
												</div>
											)}
											{block.type === 'image-block' && (
												<div className="mb-2">
													<Label>Image URL</Label>
													<Input placeholder="Paste image URL..." value={block.url} onChange={e => {
														setPages(pgs => {
															const updated = [...pgs];
															updated[activePage].blocks[idx].url = e.target.value;
															return updated;
														});
													}} />
													{block.url && <img src={block.url} alt="Preview" className="mt-2 max-h-32" />}
												</div>
											)}
											{block.type !== 'text-block' && block.type !== 'image-block' && (
												<>
													<div className="mb-2">
														<Label>Description</Label>
														<Input placeholder="Question description..." value={block.description} onChange={e => {
															setPages(pgs => {
																const updated = [...pgs];
																updated[activePage].blocks[idx].description = e.target.value;
																return updated;
															});
														}} />
													</div>
													<div className="mb-2">
														<Label>Image URL or Upload</Label>
														<div className="flex gap-2 items-center">
															<Input placeholder="Paste image URL..." value={block.image} onChange={e => {
																setPages(pgs => {
																	const updated = [...pgs];
																	updated[activePage].blocks[idx].image = e.target.value;
																	return updated;
																});
															}} />
															<input
																type="file"
																accept="image/*"
																onChange={e => {
																	const file = e.target.files?.[0];
																	if (file) {
																		const reader = new FileReader();
																		reader.onload = ev => {
																			setPages(pgs => {
																				const updated = [...pgs];
																				updated[activePage].blocks[idx].image = ev.target?.result as string;
																				return updated;
																			});
																		};
																		reader.readAsDataURL(file);
																	}
																}}
															/>
														</div>
														{block.image && <img src={block.image} alt="Preview" className="mt-2 max-h-32" />}
													</div>
													<div className="mb-2">
														<Label>Guide (help text)</Label>
														<Input placeholder="Guide/help for this question..." value={block.guide} onChange={e => {
															setPages(pgs => {
																const updated = [...pgs];
																updated[activePage].blocks[idx].guide = e.target.value;
																return updated;
															});
														}} />
													</div>
													<div className="mb-2">
														<Label>Lesson (free text)</Label>
														<Input placeholder="Lesson for this question..." value={block.lesson} onChange={e => {
															setPages(pgs => {
																const updated = [...pgs];
																updated[activePage].blocks[idx].lesson = e.target.value;
																return updated;
															});
														}} />
													</div>
													<div className="mb-2">
														<Label>Answers</Label>
														<div className="flex flex-col gap-2">
															{block.answers.map((ans, aIdx) => (
																<div key={aIdx} className="flex gap-2 items-center">
																	<Input
																		placeholder={`Answer ${aIdx + 1}`}
																		value={ans.value}
																		onChange={e => {
																			setPages(pgs => {
																				const updated = [...pgs];
																				updated[activePage].blocks[idx].answers[aIdx].value = e.target.value;
																				return updated;
																			});
																		}}
																		className="flex-1"
																	/>
																	<Input
																		type="number"
																		placeholder="Score"
																		value={ans.score}
																		onChange={e => {
																			setPages(pgs => {
																				const updated = [...pgs];
																				updated[activePage].blocks[idx].answers[aIdx].score = Number(e.target.value);
																				return updated;
																			});
																		}}
																		className="w-24"
																	/>
																	<Button
																		size="icon"
																		variant="destructive"
																		onClick={() => {
																			setPages(pgs => {
																				const updated = [...pgs];
																				updated[activePage].blocks[idx].answers.splice(aIdx, 1);
																				return updated;
																			});
																		}}
																	>
																		-
																	</Button>
																</div>
															))}
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setPages(pgs => {
																		const updated = [...pgs];
																		updated[activePage].blocks[idx].answers.push({ value: '', score: 0 });
																		return updated;
																	});
																}}
															>
																+ Add Answer
															</Button>
														</div>
													</div>
													<div className="mb-2 flex items-center gap-2">
														<input
															type="checkbox"
															checked={!!block.logic}
															onChange={e => {
																setPages(pgs => {
																	const updated = [...pgs];
																	updated[activePage].blocks[idx].logic = e.target.checked ? 'some-logic' : '';
																	return updated;
																});
															}}
														/>
														<Label>Enable logical condition (branching)</Label>
													</div>
													<ConditionalLogicEditor
														field={block}
														allFields={pages[activePage].blocks.filter((b, i) => i !== idx && b.type !== 'text-block' && b.type !== 'image-block')}
														onUpdate={updatedBlock => {
															setPages(pgs => {
																const updated = [...pgs];
																updated[activePage].blocks[idx] = { ...block, ...updatedBlock };
																return updated;
															});
														}}
													/>
												</>
											)}
											{block.type === 'image-choice' && (
												<div className="mb-2">
													<Label>Answers (with images)</Label>
													<div className="flex flex-col gap-2">
														{block.answers.map((ans, aIdx) => (
															<div key={aIdx} className="flex gap-2 items-center">
																<Input
																	placeholder="Image URL"
																	value={ans.image || ''}
																	onChange={e => {
																		setPages(pgs => {
																			const updated = [...pgs];
																			updated[activePage].blocks[idx].answers[aIdx].image = e.target.value;
																			return updated;
																		});
																	}}
																	className="w-40"
																/>
																<input
																	type="file"
																	accept="image/*"
																	onChange={e => {
																		const file = e.target.files?.[0];
																		if (file) {
																			const reader = new FileReader();
																			reader.onload = ev => {
																				setPages(pgs => {
																					const updated = [...pgs];
																					updated[activePage].blocks[idx].answers[aIdx].image = ev.target?.result as string;
																					return updated;
																				});
																			};
																			reader.readAsDataURL(file);
																		}
																	}}
																/>
																{ans.image && <img src={ans.image} alt="Preview" className="w-12 h-12 object-contain border rounded" />}
																<Input
																	type="number"
																	placeholder="Score"
																	value={ans.score}
																	onChange={e => {
																		setPages(pgs => {
																			const updated = [...pgs];
																			updated[activePage].blocks[idx].answers[aIdx].score = Number(e.target.value);
																			return updated;
																		});
																	}}
																	className="w-24"
																/>
																<Button
																	size="icon"
																	variant="destructive"
																	onClick={() => {
																		setPages(pgs => {
																			const updated = [...pgs];
																			updated[activePage].blocks[idx].answers.splice(aIdx, 1);
																			return updated;
																		});
																	}}
																>
																	-
																</Button>
															</div>
														))}
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																setPages(pgs => {
																	const updated = [...pgs];
																	updated[activePage].blocks[idx].answers.push({ image: '', score: 0 });
																	return updated;
																});
															}}
														>
															+ Add Answer
														</Button>
													</div>
												</div>
											)}
											{/* TODO: Add more editing for questions/answers/logic */}
										</CardContent>
									</Card>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default FormBuilderV2;
