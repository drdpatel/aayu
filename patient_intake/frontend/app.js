const { useState, useEffect } = React;

function Questionnaire() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
      .then(res => res.json())
      .then(data => alert('Eligibility: ' + (data.eligibility.eligible ? 'Yes' : 'No')));
  };

  return (
    <div>
      <h1>Patient Intake Questionnaire</h1>
      {questions.map(q => (
        <div key={q.id} className="question">
          <label>{q.text}<br />
            <input type="text" onChange={e => handleChange(q.id, e.target.value)} />
          </label>
        </div>
      ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

ReactDOM.render(<Questionnaire />, document.getElementById('root'));
