import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  Alert,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const });
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Chave para salvar no AsyncStorage
  const STORAGE_KEY = '@taskflow_tasks';

  // Função para salvar tarefas no AsyncStorage
  const saveTasks = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Erro ao salvar tarefas:', error);
    }
  };

  // Função para carregar tarefas do AsyncStorage
  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        // Converter strings de data de volta para objetos Date
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        setTasks(tasksWithDates);
      } else {
        // Se não há tarefas salvas, criar algumas de exemplo
        const exampleTasks: Task[] = [
          {
            id: '1',
            title: 'Revisar relatório mensal',
            description: 'Analisar dados de vendas e preparar apresentação',
            priority: 'high',
            completed: false,
            createdAt: new Date()
          },
          {
            id: '2',
            title: 'Comprar ingredientes',
            description: 'Lista: arroz, frango, legumes',
            priority: 'medium',
            completed: false,
            createdAt: new Date()
          },
          {
            id: '3',
            title: 'Agendar consulta médica',
            description: 'Marcar consulta com cardiologista',
            priority: 'low',
            completed: true,
            createdAt: new Date()
          }
        ];
        setTasks(exampleTasks);
        saveTasks(exampleTasks);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  // Carregar tarefas quando o componente monta
  useEffect(() => {
    loadTasks();
  }, []);

  // Salvar tarefas sempre que o array de tarefas mudar (exceto no carregamento inicial)
  useEffect(() => {
    // Só salva se já carregou as tarefas (evita salvar array vazio no início)
    if (tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks]);

  const addTask = () => {
    if (!newTask.title.trim()) {
      Alert.alert('Erro', 'Digite um título para a tarefa');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      completed: false,
      createdAt: new Date()
    };

    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setShowAddModal(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const confirmDelete = (id: string) => {
    setTaskToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteTask = () => {
    if (taskToDelete) {
      const updatedTasks = tasks.filter(task => task.id !== taskToDelete);
      setTasks(updatedTasks);
      setTaskToDelete(null);
      setShowDeleteModal(false);
      
      // Forçar salvamento imediato
      saveTasks(updatedTasks);
    }
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#2563eb';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Normal';
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Filtrar tarefas baseado no filtro ativo
  const filteredTasks = tasks.filter(task => {
    switch (activeFilter) {
      case 'pending':
        return !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Minimalista */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>TaskFlow</Text>
            <Text style={styles.subtitle}>Organize suas tarefas</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.addButtonContent}>
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Nova Tarefa</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Feitas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(progressPercentage)}%</Text>
            <Text style={styles.statLabel}>Progresso</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}% concluído</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
              Todas ({totalTasks})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'pending' && styles.filterTabActive]}
            onPress={() => setActiveFilter('pending')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'pending' && styles.filterTabTextActive]}>
              Pendentes ({totalTasks - completedTasks})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'completed' && styles.filterTabActive]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'completed' && styles.filterTabTextActive]}>
              Concluídas ({completedTasks})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all' ? 'Nenhuma tarefa' : 
                 activeFilter === 'pending' ? 'Nenhuma tarefa pendente' : 
                 'Nenhuma tarefa concluída'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all' ? 'Adicione sua primeira tarefa' : 
                 activeFilter === 'pending' ? 'Todas as tarefas estão concluídas!' : 
                 'Complete algumas tarefas para vê-las aqui'}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity 
                  style={styles.taskCheckbox}
                  onPress={() => toggleTask(task.id)}
                >
                  <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                    {task.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  </View>
                  
                  {task.description && (
                    <Text style={[styles.taskDescription, task.completed && styles.taskDescriptionCompleted]}>
                      {task.description}
                    </Text>
                  )}
                  
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskDate}>
                      {task.createdAt.toLocaleDateString('pt-BR')}
                    </Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        confirmDelete(task.id);
                      }}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal para Adicionar Tarefa */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Tarefa</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Formulário */}
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o título da tarefa"
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                placeholderTextColor="#666666"
                autoFocus={true}
                returnKeyType="next"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              
              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Adicione uma descrição (opcional)"
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                multiline
                numberOfLines={4}
                placeholderTextColor="#666666"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              
              <Text style={styles.inputLabel}>Prioridade</Text>
              <View style={styles.priorityOptions}>
                {[
                  { key: 'low', label: 'Baixa', color: '#059669', icon: '🟢' },
                  { key: 'medium', label: 'Média', color: '#2563eb', icon: '🔵' },
                  { key: 'high', label: 'Alta', color: '#dc2626', icon: '🔴' }
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.key}
                    style={[
                      styles.priorityOption,
                      newTask.priority === priority.key && styles.priorityOptionSelected,
                      { borderColor: priority.color }
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: priority.key as any })}
                  >
                    <Text style={styles.priorityIcon}>{priority.icon}</Text>
                    <Text style={[
                      styles.priorityOptionText,
                      newTask.priority === priority.key && styles.priorityOptionTextSelected
                    ]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Botões */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setNewTask({ title: '', description: '', priority: 'medium' });
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, !newTask.title.trim() && styles.saveButtonDisabled]}
                onPress={() => {
                  Keyboard.dismiss();
                  addTask();
                }}
                disabled={!newTask.title.trim()}
              >
                <Text style={styles.saveButtonText}>Criar Tarefa</Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Text style={styles.deleteModalTitle}>Excluir Tarefa</Text>
            </View>
            
            <View style={styles.deleteModalBody}>
              <Text style={styles.deleteModalIcon}>🗑️</Text>
              <Text style={styles.deleteModalText}>
                Tem certeza que deseja excluir esta tarefa?
              </Text>
              <Text style={styles.deleteModalSubtext}>
                Esta ação não pode ser desfeita.
              </Text>
            </View>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteCancelButton}
                onPress={cancelDelete}
              >
                <Text style={styles.deleteCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteConfirmButton}
                onPress={deleteTask}
              >
                <Text style={styles.deleteConfirmButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#222222',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  tasksList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  taskCheckbox: {
    marginRight: 16,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  taskDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDescriptionCompleted: {
    color: '#555555',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    color: '#666666',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '300',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#222222',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#888888',
    fontWeight: '300',
  },
  formSection: {
    padding: 24,
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priorityOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
  },
  priorityOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  priorityIcon: {
    fontSize: 16,
    marginBottom: 8,
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
  },
  priorityOptionTextSelected: {
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  saveButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  // Estilos do Modal de Exclusão
  deleteModalContent: {
    backgroundColor: '#111111',
    borderRadius: 16,
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: '#222222',
  },
  deleteModalHeader: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  deleteModalBody: {
    padding: 24,
    alignItems: 'center',
  },
  deleteModalIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  deleteModalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  deleteCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  deleteConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#dc2626',
  },
  deleteConfirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
