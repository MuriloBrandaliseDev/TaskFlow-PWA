// Sistema de notificações para PWA
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_KEY = '@taskflow_notifications';

export interface NotificationSettings {
  enabled: boolean;
  reminderMinutes: number; // minutos antes do vencimento
}

export interface TaskWithNotification {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  reminderSent?: boolean;
}

// Solicitar permissão para notificações
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Salvar configurações de notificação
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Erro ao salvar configurações de notificação:', error);
  }
};

// Carregar configurações de notificação
export const loadNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações de notificação:', error);
  }
  
  // Configurações padrão
  return {
    enabled: false,
    reminderMinutes: 30, // 30 minutos antes
  };
};

// Verificar tarefas próximas do vencimento
export const checkUpcomingTasks = async (tasks: TaskWithNotification[]): Promise<void> => {
  const settings = await loadNotificationSettings();
  
  if (!settings.enabled) {
    return;
  }

  const now = new Date();
  const reminderTime = new Date(now.getTime() + (settings.reminderMinutes * 60 * 1000));

  const upcomingTasks = tasks.filter(task => {
    if (task.completed || !task.dueDate || task.reminderSent) {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    return dueDate <= reminderTime && dueDate > now;
  });

  for (const task of upcomingTasks) {
    await showTaskNotification(task);
    
    // Marcar como notificação enviada
    task.reminderSent = true;
  }
};

// Mostrar notificação de tarefa
export const showTaskNotification = async (task: TaskWithNotification): Promise<void> => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const timeLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60)) : 0;

  const notification = new Notification('TaskFlow - Lembrete de Tarefa', {
    body: `"${task.title}" ${timeLeft > 0 ? `vence em ${timeLeft} minutos` : 'está vencida!'}`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `task-${task.id}`,
    requireInteraction: true,
    actions: [
      {
        action: 'complete',
        title: 'Marcar como Concluída',
        icon: '/icon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icon.svg'
      }
    ]
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close após 10 segundos
  setTimeout(() => {
    notification.close();
  }, 10000);
};

// Verificar tarefas vencidas
export const checkOverdueTasks = async (tasks: TaskWithNotification[]): Promise<void> => {
  const settings = await loadNotificationSettings();
  
  if (!settings.enabled) {
    return;
  }

  const now = new Date();
  const overdueTasks = tasks.filter(task => {
    if (task.completed || !task.dueDate) {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    return dueDate < now;
  });

  if (overdueTasks.length > 0) {
    await showOverdueNotification(overdueTasks.length);
  }
};

// Mostrar notificação de tarefas vencidas
export const showOverdueNotification = async (count: number): Promise<void> => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification('TaskFlow - Tarefas Vencidas', {
    body: `Você tem ${count} tarefa${count > 1 ? 's' : ''} vencida${count > 1 ? 's' : ''}!`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'overdue-tasks',
    requireInteraction: true
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  setTimeout(() => {
    notification.close();
  }, 8000);
};

// Inicializar sistema de notificações
export const initializeNotifications = async (): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    // Verificar tarefas a cada 5 minutos
    setInterval(async () => {
      // Esta função será chamada pelo App.tsx com as tarefas atuais
    }, 5 * 60 * 1000);
  }
};
