// Function to go to page 1 (main content)
function goToFirstPage() {
    const mainContent = document.getElementById('main-content');
    const allPages = document.querySelectorAll('.second-page, .third-page, .fourth-page, .question-page, .final-page');
    
    // Hide all other pages
    allPages.forEach(page => {
        if (!page.classList.contains('hidden')) {
            const wrapper = page.querySelector('.how-i-do-it-wrapper, .are-you-wrapper, .user-info-wrapper, .question-wrapper, .final-wrapper');
            if (wrapper) {
                wrapper.classList.add('content-fade-out');
            }
        }
    });
    
    setTimeout(() => {
        allPages.forEach(page => {
            page.classList.add('hidden');
            const wrapper = page.querySelector('.how-i-do-it-wrapper, .are-you-wrapper, .user-info-wrapper, .question-wrapper, .final-wrapper');
            if (wrapper) {
                wrapper.classList.remove('content-fade-out');
            }
        });
        
        // Show main content
        mainContent.classList.remove('hidden');
        const mainContentWrapper = mainContent.querySelector('.content-wrapper');
        if (mainContentWrapper) {
            requestAnimationFrame(() => {
                mainContentWrapper.classList.add('content-fade-in');
            });
        }
    }, 400);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const letsDoItBtn = document.getElementById('lets-do-it-btn');
    
    // Make all logo containers clickable
    const logoContainers = document.querySelectorAll('.logo-container');
    logoContainers.forEach(container => {
        container.addEventListener('click', function() {
            goToFirstPage();
        });
    });

    // Show splash screen for a brief moment (enough to read "wingmann")
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        
        // After fade out animation completes, show main content
        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainContent.classList.remove('hidden');
        }, 500); // Match CSS transition duration
    }, 1000); // Show splash for 1 second (enough to read)

    // Button click handler - navigate to second page
    letsDoItBtn.addEventListener('click', function() {
        
        const secondPage = document.getElementById('second-page');
        const textContent = mainContent.querySelector('.text-content');
        const characterContainer = mainContent.querySelector('.character-container');
        const character = mainContent.querySelector('.character');
        const secondPageContent = secondPage.querySelector('.how-i-do-it-content');
        const secondPageCharacter = secondPage.querySelector('.character-container-second');
        const secondPageCharacterImg = secondPage.querySelector('.character-second');
        
        // Add click animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
        
        // Prevent character from animating/changing size - keep it completely static
        if (characterContainer) {
            characterContainer.classList.add('transitioning');
            characterContainer.style.animation = 'none !important';
            characterContainer.style.transform = 'none !important';
            characterContainer.style.transition = 'none !important';
        }
        if (character) {
            character.classList.add('transitioning');
            character.style.transform = 'scale(1) !important';
            character.style.width = '260px';
            character.style.height = '260px';
            character.style.transition = 'none !important';
            character.style.animation = 'none !important';
        }
        
        // Only fade out text content (no slide)
        if (textContent) {
            textContent.classList.add('content-fade-out');
        }
        
        // Keep character completely static - no fade, no movement, no size change
        // Both characters are in the same grid position, so they'll naturally stay in place
        if (characterContainer && secondPageCharacter) {
            // Keep page 1 character visible and static
            characterContainer.style.opacity = '1';
            characterContainer.style.transition = 'none';
            
            // Prepare second page character to appear in same grid position (already aligned)
            secondPageCharacter.style.opacity = '0';
            secondPageCharacter.style.transition = 'opacity 0.3s ease';
            secondPageCharacter.classList.add('transitioning');
        }
        if (secondPageCharacterImg) {
            secondPageCharacterImg.classList.add('transitioning');
            secondPageCharacterImg.style.transform = 'scale(1) !important';
            secondPageCharacterImg.style.width = '260px';
            secondPageCharacterImg.style.height = '260px';
            secondPageCharacterImg.style.transition = 'none !important';
            secondPageCharacterImg.style.animation = 'none !important';
        }
        
        // After text content fades out, hide main content and show second page
        setTimeout(() => {
            // Hide the text content
            if (textContent) {
                textContent.style.display = 'none';
                textContent.classList.remove('content-fade-out');
            }
            
            // Show second page (character is already in same grid position)
            mainContent.classList.add('hidden');
            secondPage.classList.remove('hidden');
            
            // Fade in second page character smoothly
            if (secondPageCharacter) {
                secondPageCharacter.style.opacity = '1';
            }
            
            // Animate new text content in (fade only, no slide)
            if (secondPageContent) {
                requestAnimationFrame(() => {
                    secondPageContent.classList.add('content-fade-in');
                });
            }
        }, 400);
    });

    // Navigation functionality
    const secondPage = document.getElementById('second-page');
    const thirdPage = document.getElementById('third-page');
    const fourthPage = document.getElementById('fourth-page');
    let isTransitioning = false;

    // Function to scroll to top on mobile
    function scrollToTopOnMobile() {
        if (window.innerWidth <= 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Function to transition to fourth page
    function goToFourthPage() {
        if (isTransitioning || thirdPage.classList.contains('hidden')) return;
        
        isTransitioning = true;
        
        const thirdPageWrapper = thirdPage.querySelector('.are-you-wrapper');
        const fourthPageWrapper = fourthPage.querySelector('.user-info-wrapper');
        
        // Animate current content out
        if (thirdPageWrapper) {
            thirdPageWrapper.classList.add('content-fade-out');
        }
        
        // After content slides out, hide third page and show fourth page
        setTimeout(() => {
            thirdPage.classList.add('hidden');
            if (thirdPageWrapper) {
                thirdPageWrapper.classList.remove('content-fade-out');
            }
            fourthPage.classList.remove('hidden');
            // Scroll to top on mobile
            scrollToTopOnMobile();
            // Animate new content in
            if (fourthPageWrapper) {
                // Small delay to ensure page is visible before animating
                setTimeout(() => {
                    fourthPageWrapper.classList.add('content-fade-in');
                }, 50);
            }
        }, 500); // Match animation duration (0.5s)
        
        setTimeout(() => {
            isTransitioning = false;
        }, 1100);
    }


    // Handle yes/no button clicks
    const answerButtons = document.querySelectorAll('.answer-btn');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');
    
    answerButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionItem = this.closest('.question-item');
            const buttons = questionItem.querySelectorAll('.answer-btn');
            
            // Remove selected class from all buttons in this question
            buttons.forEach(b => b.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Hide error message when user changes an answer
            if (errorMessage) {
                errorMessage.classList.add('hidden');
                errorMessage.classList.remove('fade-out');
            }
        });
    });

    // Handle submit button click
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            const questionItems = document.querySelectorAll('.question-item');
            let allYes = true;
            let allAnswered = true;
            
            // Check each question
            questionItems.forEach(item => {
                const selectedBtn = item.querySelector('.answer-btn.selected');
                if (!selectedBtn) {
                    allAnswered = false;
                    allYes = false;
                } else {
                    const answer = selectedBtn.getAttribute('data-answer');
                    if (answer !== 'yes') {
                        allYes = false;
                    }
                }
            });
            
            // If not all answered, show error
            if (!allAnswered) {
                if (errorMessage) {
                    errorMessage.textContent = 'Please answer all questions before submitting.';
                    errorMessage.classList.remove('hidden');
                }
                return;
            }
            
            // If all answers are yes, proceed to next page
            if (allYes) {
                // Hide error message if visible
                if (errorMessage) {
                    errorMessage.classList.add('hidden');
                    errorMessage.classList.remove('fade-out');
                }
                // Navigate to fourth page
                goToFourthPage();
            } else {
                // Show error message
                if (errorMessage) {
                    errorMessage.innerHTML = 'Looks like you\'re not quite there yet - and that\'s okay.<br>Come back when "yes" feels effortless';
                    errorMessage.classList.remove('hidden');
                }
            }
        });
    }

    // Validation functions
    function isValidMobile(mobile) {
        // Remove any spaces, dashes, or other characters
        const cleaned = mobile.replace(/\D/g, '');
        // Check if it's exactly 10 digits
        return /^\d{10}$/.test(cleaned);
    }

    function isValidEmail(email) {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Handle form submit button - navigate to first question page
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const contactInput = document.getElementById('contact-input');
    const contactError = document.getElementById('contact-error');
    const ageInput = document.getElementById('age-input');
    
    if (formSubmitBtn) {
        formSubmitBtn.addEventListener('click', function() {
            const name = document.getElementById('name-input').value.trim();
            const age = ageInput.value.trim();
            const gender = document.getElementById('gender-input').value.trim();
            const city = document.getElementById('city-input').value.trim();
            const contact = contactInput.value.trim();
            
            // Validate all fields are filled
            if (!name || !age || !gender || !city || !contact) {
                alert('Please fill in all fields before submitting.');
                return;
            }
            
            // Validate age
            const ageNum = parseInt(age);
            if (isNaN(ageNum) || ageNum < 20 || ageNum > 120) {
                alert('Please enter a valid age (20-120).');
                ageInput.focus();
                return;
            }
            
            // Validate contact (mobile or email)
            const isMobile = isValidMobile(contact);
            const isEmail = isValidEmail(contact);
            
            if (!isMobile && !isEmail) {
                // Show error message
                if (contactError) {
                    contactError.textContent = 'Please enter a valid 10-digit mobile number or email address.';
                    contactError.classList.remove('hidden');
                } else {
                    alert('Please enter a valid 10-digit mobile number or email address.');
                }
                // Highlight the input field
                contactInput.style.borderColor = '#ff4444';
                contactInput.focus();
                return;
            }
            
            // Clear any previous errors
            if (contactError) {
                contactError.classList.add('hidden');
            }
            contactInput.style.borderColor = '';
            
            // Navigate to first question page
            goToQuestionPage(1);
        });
    }
    
    // Real-time validation feedback on contact input
    if (contactInput) {
        contactInput.addEventListener('input', function() {
            const contact = this.value.trim();
            if (contact) {
                const isMobile = isValidMobile(contact);
                const isEmail = isValidEmail(contact);
                
                if (!isMobile && !isEmail) {
                    this.style.borderColor = '#ffaa00';
                } else {
                    this.style.borderColor = '#4caf50';
                    if (contactError) {
                        contactError.classList.add('hidden');
                    }
                }
            } else {
                this.style.borderColor = '';
                if (contactError) {
                    contactError.classList.add('hidden');
                }
            }
        });
    }
});

// Global navigation functions for page 2 and 3
let isTransitioning = false;

function goToSecondPage() {
    const secondPage = document.getElementById('second-page');
    const thirdPage = document.getElementById('third-page');
    
    if (isTransitioning || thirdPage.classList.contains('hidden')) return;
    
    isTransitioning = true;
    
    const thirdPageWrapper = thirdPage.querySelector('.are-you-wrapper');
    const secondPageWrapper = secondPage.querySelector('.how-i-do-it-wrapper');
    
    // Animate current content out
    if (thirdPageWrapper) {
        thirdPageWrapper.classList.add('content-fade-out');
    }
    
    // After content fades out, hide third page and show second page
    setTimeout(() => {
        thirdPage.classList.add('hidden');
        if (thirdPageWrapper) {
            thirdPageWrapper.classList.remove('content-fade-out');
        }
        secondPage.classList.remove('hidden');
        // Scroll to top on mobile
        scrollToTopOnMobile();
        // Animate new content in
        if (secondPageWrapper) {
            requestAnimationFrame(() => {
                secondPageWrapper.classList.add('content-fade-in');
            });
        }
    }, 400);
    
    setTimeout(() => {
        isTransitioning = false;
    }, 800);
}

// Function to scroll to top on mobile
function scrollToTopOnMobile() {
    if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToThirdPage() {
    const secondPage = document.getElementById('second-page');
    const thirdPage = document.getElementById('third-page');
    
    if (isTransitioning || secondPage.classList.contains('hidden')) return;
    
    isTransitioning = true;
    
    const secondPageWrapper = secondPage.querySelector('.how-i-do-it-wrapper');
    const thirdPageWrapper = thirdPage.querySelector('.are-you-wrapper');
    
    // Animate current content out
    if (secondPageWrapper) {
        secondPageWrapper.classList.add('content-fade-out');
    }
    
    // After content fades out, hide second page and show third page
    setTimeout(() => {
        secondPage.classList.add('hidden');
        if (secondPageWrapper) {
            secondPageWrapper.classList.remove('content-fade-out');
        }
        thirdPage.classList.remove('hidden');
        // Scroll to top on mobile
        scrollToTopOnMobile();
        // Animate new content in
        if (thirdPageWrapper) {
            requestAnimationFrame(() => {
                thirdPageWrapper.classList.add('content-fade-in');
            });
        }
    }, 400);
    
    setTimeout(() => {
        isTransitioning = false;
    }, 800);
}

// Question page navigation functions
function goToQuestionPage(pageNum) {
    const currentPage = document.getElementById('fourth-page');
    const questionPage = document.getElementById(`question-page-${pageNum}`);
    
    if (currentPage && !currentPage.classList.contains('hidden')) {
        // Coming from form page
        const currentWrapper = currentPage.querySelector('.user-info-wrapper');
        const questionWrapper = questionPage.querySelector('.question-wrapper');
        
        if (currentWrapper) {
            currentWrapper.classList.add('content-fade-out');
        }
        
        setTimeout(() => {
            currentPage.classList.add('hidden');
            if (currentWrapper) {
                currentWrapper.classList.remove('content-fade-out');
            }
            questionPage.classList.remove('hidden');
            // Scroll to top on mobile
            scrollToTopOnMobile();
            if (questionWrapper) {
                requestAnimationFrame(() => {
                    questionWrapper.classList.add('content-fade-in');
                });
            }
        }, 400);
    } else {
        // Coming from another question page
        const allQuestionPages = document.querySelectorAll('.question-page');
        let currentWrapper = null;
        
        allQuestionPages.forEach(page => {
            if (!page.classList.contains('hidden')) {
                currentWrapper = page.querySelector('.question-wrapper');
                if (currentWrapper) {
                    currentWrapper.classList.add('content-fade-out');
                }
            }
        });
        
        const questionWrapper = questionPage.querySelector('.question-wrapper');
        
        setTimeout(() => {
            allQuestionPages.forEach(page => {
                if (!page.classList.contains('hidden')) {
                    page.classList.add('hidden');
                    const wrapper = page.querySelector('.question-wrapper');
                    if (wrapper) {
                        wrapper.classList.remove('content-fade-out');
                    }
                }
            });
            questionPage.classList.remove('hidden');
            // Scroll to top on mobile
            scrollToTopOnMobile();
            if (questionWrapper) {
                requestAnimationFrame(() => {
                    questionWrapper.classList.add('content-fade-in');
                });
            }
        }, 400);
    }
}

function goToNextQuestion(currentPage) {
    const answer = document.getElementById(`answer-${currentPage}`).value.trim();
    if (!answer) {
        alert('Come on, give us something! 😊');
        return;
    }
    
    if (currentPage < 4) {
        goToQuestionPage(currentPage + 1);
    }
}

function goToPreviousQuestion(currentPage) {
    if (currentPage === 1) {
        // Go back to form page
        const formPage = document.getElementById('fourth-page');
        const questionPage = document.getElementById(`question-page-${currentPage}`);
        const questionWrapper = questionPage.querySelector('.question-wrapper');
        const formWrapper = formPage.querySelector('.user-info-wrapper');
        
        if (questionWrapper) {
            questionWrapper.classList.add('content-fade-out');
        }
        
        setTimeout(() => {
            questionPage.classList.add('hidden');
            if (questionWrapper) {
                questionWrapper.classList.remove('content-fade-out');
            }
            formPage.classList.remove('hidden');
            // Scroll to top on mobile
            scrollToTopOnMobile();
            if (formWrapper) {
                requestAnimationFrame(() => {
                    formWrapper.classList.add('content-fade-in');
                });
            }
        }, 400);
    } else {
        goToQuestionPage(currentPage - 1);
    }
}

function submitAllAnswers() {
    const answer1 = document.getElementById('answer-1').value.trim();
    const answer2 = document.getElementById('answer-2').value.trim();
    const answer3 = document.getElementById('answer-3').value.trim();
    const answer4 = document.getElementById('answer-4').value.trim();
    
    if (!answer1 || !answer2 || !answer3 || !answer4) {
        alert('Hey! Finish all the questions first! We want to know everything about you! 💕');
        return;
    }
    
    // Get all form data
    const name = document.getElementById('name-input').value.trim();
    const age = document.getElementById('age-input').value.trim();
    const gender = document.getElementById('gender-input').value.trim();
    const city = document.getElementById('city-input').value.trim();
    const contact = document.getElementById('contact-input').value.trim();
    
    // Capitalize first letter (simple one-liner, no extra logic)
    const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
    
    const allData = {
        personalInfo: { name: cap(name), age, gender, city, contact },
        answers: {
            question1: cap(answer1),
            question2: cap(answer2),
            question3: cap(answer3),
            question4: cap(answer4)
        }
    };
    
    // Send data to server for collection
    sendDataToServer(allData);
    
    // Navigate to final thank you page
    goToFinalPage();
}

async function sendDataToServer(data) {
    try {
        // Add submission timestamp
        const submissionData = {
            ...data,
            submissionDate: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        // Send to backend API endpoint
        // Replace this URL with your actual backend endpoint
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });
        
        if (response.ok) {
            console.log('Data successfully sent to server');
        } else {
            console.error('Failed to send data to server:', response.statusText);
            // Fallback: store in localStorage as backup
            storeDataLocally(data);
        }
    } catch (error) {
        console.error('Error sending data to server:', error);
        // Fallback: store in localStorage as backup
        storeDataLocally(data);
    }
}

function storeDataLocally(data) {
    // Fallback storage in localStorage (limited to ~5-10MB)
    // This is just a backup - you'll need to implement proper backend
    try {
        const existingData = JSON.parse(localStorage.getItem('wingmann_submissions') || '[]');
        existingData.push({
            ...data,
            submissionDate: new Date().toISOString()
        });
        localStorage.setItem('wingmann_submissions', JSON.stringify(existingData));
        console.log('Data stored locally as backup');
    } catch (error) {
        console.error('Error storing data locally:', error);
    }
}

function goToFinalPage() {
    const questionPage = document.getElementById('question-page-4');
    const finalPage = document.getElementById('final-page');
    const questionWrapper = questionPage.querySelector('.question-wrapper');
    const finalWrapper = finalPage.querySelector('.final-wrapper');
    
    if (questionWrapper) {
        questionWrapper.classList.add('content-fade-out');
    }
    
    setTimeout(() => {
        questionPage.classList.add('hidden');
        if (questionWrapper) {
            questionWrapper.classList.remove('content-fade-out');
        }
        finalPage.classList.remove('hidden');
        // Scroll to top on mobile
        scrollToTopOnMobile();
        if (finalWrapper) {
            requestAnimationFrame(() => {
                finalWrapper.classList.add('content-fade-in');
            });
        }
    }, 400);
}
