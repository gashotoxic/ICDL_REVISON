document.addEventListener('DOMContentLoaded', () => {
  // Handle login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const result = await response.json();
        window.location.href = '/';
      } catch (error) {
        alert('Login failed. Please check your credentials.');
      }
    });
  }

  // Handle registration form submission
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData.entries());
      
      if (data.password !== data['confirm-password']) {
        alert('Passwords do not match');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: data.username,
            password: data.password
          })
        });
        
        if (!response.ok) {
          throw new Error('Registration failed');
        }
        
        const result = await response.json();
        alert('Registration successful! Please login.');
        window.location.href = '/api/auth/login';
      } catch (error) {
        alert('Registration failed. Please try again.');
      }
    });
  }

  // DOM Elements
  const moduleSelection = document.getElementById('module-selection');
  const quizSection = document.getElementById('quiz-section');
  const resultsSection = document.getElementById('results-section');
  const modulesList = document.getElementById('modules-list');
  const quizContainer = document.getElementById('quiz-container');
  const submitQuizBtn = document.getElementById('submit-quiz');
  const resultsContainer = document.getElementById('results-container');
  const themeToggle = document.getElementById('theme-toggle');

  // Theme Management
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-mode', currentTheme === 'dark');

  themeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeToggleIcon(isDarkMode);
  });

  function updateThemeToggleIcon(isDarkMode) {
    const lightIcon = themeToggle.querySelector('.light-icon');
    const darkIcon = themeToggle.querySelector('.dark-icon');
    lightIcon.style.display = isDarkMode ? 'none' : 'inline';
    darkIcon.style.display = isDarkMode ? 'inline' : 'none';
  }

  // Initialize theme toggle icon
  updateThemeToggleIcon(currentTheme === 'dark');

  // Fetch and display modules
  fetch('/api/modules')
    .then(response => response.json())
    .then(modules => {
      modulesList.innerHTML = modules.map(module => `
        <div class="module-card" data-id="${module.id}">
          <h3>${module.name}</h3>
          <p>${module.description}</p>
        </div>
      `).join('');

      // Add click handlers to module cards
      document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', () => {
          moduleSelection.classList.add('hidden');
          quizSection.classList.remove('hidden');
          loadQuiz(card.dataset.id);
        });
      });
    });

  // Handle quiz submission
  submitQuizBtn.addEventListener('click', () => {
    const answers = [];
    document.querySelectorAll('.answer').forEach((answer, index) => {
      answers.push({
        questionId: index + 1,
        answer: answer.value
      });
    });

    fetch('/api/submit-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers })
    })
      .then(response => response.json())
      .then(results => {
        quizSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        displayResults(results);
      });
  });

  // Handle hint requests
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('get-hint')) {
      const questionId = e.target.dataset.questionId;
      const questionDiv = e.target.closest('.question');
      
      try {
        const response = await fetch(`/api/questions/${questionId}/hint`, {
          method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to get hint');
        
        const { hint } = await response.json();
        const hintDiv = document.createElement('div');
        hintDiv.className = 'hint-display';
        hintDiv.textContent = `Hint: ${hint}`;
        questionDiv.appendChild(hintDiv);
      } catch (error) {
        alert('Failed to get hint. Please try again.');
      }
    }
  });

  function loadQuiz(moduleId) {
    fetch(`/api/modules/${moduleId}/questions`)
      .then(response => response.json())
      .then(questions => {
        quizContainer.innerHTML = questions.map((question, index) => `
          <div class="question">
            <h3>Question ${index + 1}: ${question.question}</h3>
            <textarea class="answer" data-question-id="${question.id}" 
              placeholder="Your answer..."></textarea>
            <button class="get-hint" data-question-id="${question.id}">Get Hint</button>
          </div>
        `).join('');
      });
  }

  function displayResults(results) {
    resultsContainer.innerHTML = `
      <h3>Your Score: ${results.score}%</h3>
      <div class="results-details">
        ${results.details.map(detail => `
          <div class="result-item ${detail.correct ? 'correct' : 'incorrect'}">
            <p><strong>Question:</strong> ${detail.question}</p>
            <p><strong>Your Answer:</strong> ${detail.userAnswer}</p>
            <p><strong>Correct Answer:</strong> ${detail.correctAnswer}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
});