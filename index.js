import fs from 'fs';
import yaml from 'js-yaml';
import cron from 'node-cron';
import { TaskwarriorLib } from 'taskwarrior-lib';

const taskwarrior = new TaskwarriorLib();

// Load tasks from YAML file
function loadTaskConfig(filePath = './tasks.yaml') {
  try {
    const file = fs.readFileSync(filePath, 'utf8');
    return yaml.load(file);
  } catch (err) {
    console.error('Failed to load YAML config:', err.message);
    return [];
  }
}

// Check if a task with the same description is already pending
function taskExists(description) {
  const tasks = taskwarrior.load('status:pending');
  return tasks.some(task => task.description === description);
}

// Schedule tasks based on the YAML config
function scheduleRecurringTasks() {
  const tasks = loadTaskConfig();

  tasks.forEach(({ description, tags, schedule }) => {
    if (!description || !schedule) {
      console.warn(`Skipping task with invalid config:`, { description, schedule });
      return;
    }

    cron.schedule(schedule, () => {
      if (taskExists(description)) {
        console.log(`[${new Date().toISOString()}] Skipped "${description}" — already exists.`);
        return;
      }

      const result = taskwarrior.update([{ description, tags }]);
      console.log(`[${new Date().toISOString()}] Created task: "${description}"`, result);
    });

    console.log(`Scheduled "${description}" with cron "${schedule}"`);
  });
}

// Start
scheduleRecurringTasks();
