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
  TouchableWithoutFeedback,
  Animated,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import SplashScreen from './src/components/SplashScreen';
import { getDeviceId, getStorageKey } from './src/utils/deviceId';
import { 
  initializeNotifications, 
  checkUpcomingTasks, 
  checkOverdueTasks,
  loadNotificationSettings,
  type TaskWithNotification 
} from './src/utils/notifications';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  reminderSent?: boolean;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as const,
    dueDate: '',
    dueTime: ''
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Função para salvar tarefas no AsyncStorage
  const saveTasks = async (tasksToSave: Task[]) => {
    if (!deviceId) return;
    try {
      const storageKey = getStorageKey(deviceId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Erro ao salvar tarefas:', error);
    }
  };

  // Função para carregar tarefas do AsyncStorage
  const loadTasks = async () => {
    if (!deviceId) return;
    try {
      const storageKey = getStorageKey(deviceId);
      const savedTasks = await AsyncStorage.getItem(storageKey);
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
            title: 'Bem-vindo ao TaskFlow!',
            description: 'Esta é sua primeira tarefa. Toque para marcar como concluída.',
            priority: 'high',
            completed: false,
            createdAt: new Date()
          },
          {
            id: '2',
            title: 'Explore o app',
            description: 'Teste criar, editar e excluir tarefas',
            priority: 'medium',
            completed: false,
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

  // Inicializar app
  const initializeApp = async () => {
    try {
      const id = await getDeviceId();
      setDeviceId(id);
      await loadTasks();
      
      // Inicializar notificações
      await initializeNotifications();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      setIsLoading(false);
    }
  };

  // Finalizar splash screen
  const handleSplashFinish = () => {
    setShowSplash(false);
    initializeApp();
  };

  // Salvar tarefas sempre que o array de tarefas mudar (exceto no carregamento inicial)
  useEffect(() => {
    // Só salva se já carregou as tarefas e tem deviceId (evita salvar array vazio no início)
    if (tasks.length > 0 && deviceId) {
      saveTasks(tasks);
    }
  }, [tasks, deviceId]);

  // Animar entrada do conteúdo
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  // Verificar notificações periodicamente
  useEffect(() => {
    if (tasks.length > 0 && !isLoading) {
      const checkNotifications = async () => {
        await checkUpcomingTasks(tasks as TaskWithNotification[]);
        await checkOverdueTasks(tasks as TaskWithNotification[]);
      };

      // Verificar imediatamente
      checkNotifications();

      // Verificar a cada 5 minutos
      const interval = setInterval(checkNotifications, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [tasks, isLoading]);

  const addTask = () => {
    if (!newTask.title.trim()) {
      Alert.alert('Erro', 'Digite um título para a tarefa');
      return;
    }

    // Criar data de vencimento se fornecida
    let dueDate: Date | undefined;
    if (newTask.dueDate && newTask.dueTime) {
      const isoDateString = convertBrazilianDateToISO(newTask.dueDate, newTask.dueTime);
      if (isoDateString) {
        dueDate = new Date(isoDateString);
        
        // Verificar se a data é válida e no futuro
        if (isNaN(dueDate.getTime()) || dueDate <= new Date()) {
          Alert.alert('Erro', 'A data de vencimento deve ser no futuro');
          return;
        }
      } else {
        Alert.alert('Erro', 'Formato de data ou hora inválido');
        return;
      }
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      completed: false,
      createdAt: new Date(),
      dueDate: dueDate,
      reminderSent: false
    };

    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '' });
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

  // Função para formatar data brasileira (DD/MM/AAAA)
  const formatBrazilianDate = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Aplica a máscara DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Função para formatar hora brasileira (HH:MM)
  const formatBrazilianTime = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Aplica a máscara HH:MM
    if (numbers.length <= 2) {
      return numbers;
    } else {
      return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
  };

  // Função para converter data brasileira para formato ISO
  const convertBrazilianDateToISO = (brazilianDate: string, time: string) => {
    if (!brazilianDate || !time) return null;
    
    // Formato: DD/MM/AAAA
    const [day, month, year] = brazilianDate.split('/');
    if (!day || !month || !year) return null;
    
    // Formato: HH:MM
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return null;
    
    // Criar data no formato ISO (AAAA-MM-DDTHH:MM)
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    return isoDate;
  };

  // Função para formatar data para exibição brasileira
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Mostrar splash screen
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatusBar style="light" />
      
      {/* Header Minimalista */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>TaskFlow</Text>
            <Text style={styles.subtitle}>Organize suas tarefas</Text>
            {deviceId && (
              <Text style={styles.deviceInfo}>
                Dispositivo: {deviceId.slice(-8)}
              </Text>
            )}
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
                    <View style={styles.taskDates}>
                      <Text style={styles.taskDate}>
                        Criada: {task.createdAt.toLocaleDateString('pt-BR')}
                      </Text>
                      {task.dueDate && (
                        <Text style={[
                          styles.taskDueDate,
                          new Date(task.dueDate) < new Date() && !task.completed && styles.taskOverdue
                        ]}>
                          Vence: {new Date(task.dueDate).toLocaleDateString('pt-BR')} às {new Date(task.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>
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
            <ScrollView style={styles.formSection} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.scrollHint}>↓ Mais campos abaixo</Text>
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
              
              <Text style={styles.inputLabel}>Data de Vencimento (Opcional)</Text>
              <Text style={styles.scrollHint}>↓ Role para baixo para ver mais campos</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeInput}>
                  <Text style={styles.dateTimeLabel}>Data</Text>
                  <TextInput
                    style={styles.dateTimeField}
                    placeholder="DD/MM/AAAA"
                    value={newTask.dueDate}
                    onChangeText={(text) => {
                      const formatted = formatBrazilianDate(text);
                      setNewTask({ ...newTask, dueDate: formatted });
                    }}
                    placeholderTextColor="#666666"
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <View style={styles.dateTimeInput}>
                  <Text style={styles.dateTimeLabel}>Hora</Text>
                  <TextInput
                    style={styles.dateTimeField}
                    placeholder="HH:MM"
                    value={newTask.dueTime}
                    onChangeText={(text) => {
                      const formatted = formatBrazilianTime(text);
                      setNewTask({ ...newTask, dueTime: formatted });
                    }}
                    placeholderTextColor="#666666"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
              
              {(newTask.dueDate || newTask.dueTime) && (
                <View style={styles.dueDatePreview}>
                  <Text style={styles.dueDatePreviewText}>
                    📅 Vencimento: {newTask.dueDate && newTask.dueTime ? 
                      `${newTask.dueDate} às ${newTask.dueTime}` : 
                      newTask.dueDate ? newTask.dueDate : newTask.dueTime
                    }
                  </Text>
                </View>
              )}
              
              <View style={styles.scrollEndIndicator}>
                <Text style={styles.scrollEndText}>📝 Formulário completo</Text>
                <Text style={styles.scrollEndSubtext}>Use os botões abaixo para salvar</Text>
              </View>
            </ScrollView>
            
            {/* Botões */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '' });
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    minHeight: Platform.OS === 'web' ? '100vh' : '100vh',
    paddingTop: Platform.OS === 'web' ? -10 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 5 : 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 24,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 24 : 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  deviceInfo: {
    fontSize: 10,
    color: '#444444',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    minHeight: Platform.OS === 'web' ? 'calc(100vh - 80px)' : '100vh',
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
    paddingBottom: Platform.OS === 'web' ? 40 : 24,
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    alignItems: 'flex-start',
  },
  taskDates: {
    flex: 1,
  },
  taskDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  taskOverdue: {
    color: '#dc2626',
    fontWeight: '600',
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 10 : 24,
    paddingTop: Platform.OS === 'web' ? 50 : 24,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#222222',
    maxHeight: Platform.OS === 'web' ? '85vh' : '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    minHeight: 60,
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
    flex: 1,
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
    minHeight: 48,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  priorityOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
    minHeight: 60,
    justifyContent: 'center',
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    marginBottom: 6,
  },
  dateTimeField: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
    textAlign: 'center',
    minHeight: 48,
  },
  dueDatePreview: {
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    marginBottom: 16,
    marginTop: 8,
  },
  dueDatePreviewText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  scrollEndIndicator: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  scrollEndText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  scrollEndSubtext: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
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
