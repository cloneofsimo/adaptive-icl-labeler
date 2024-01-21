import React, { useState, useEffect } from 'react';
import { ChakraProvider, Container, Code, Heading, Box, Flex, Text, Textarea, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Switch, FormLabel } from '@chakra-ui/react';

import { getLatestItem, pseudoLabelItem, saveItem } from './ApiService';
import { motion } from 'framer-motion';
import { Input, Button } from '@chakra-ui/react';

import { css, Global } from '@emotion/react';
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/mode-python'; // Import the mode (language)
import 'ace-builds/src-noconflict/theme-monokai'; // Import the theme

import './app.css'

// Custom fonts and global styles
const globalStyles = (
  <Global
    styles={css`
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
      body {
        font-family: 'Your Custom Font', sans-serif;
      }
    `}
  />
);

function App() {
  const [currentItem, setCurrentItem] = useState({
    item_id: null,
    text: '',
    processed_value: '',
    detailed_answer: '',
  });
  const [processedValue, setProcessedValue] = useState('');
  const [detailAnswer, setDetailAnswer] = useState('');
  const [history, setHistory] = useState([]);
  const [regexRules, setRegexRules] = useState('');
  const [taskDescription, setTaskDescription] = useState('Your goal is to determine the type of question being asked. The question types are: Ambiguous, Factual Question, Opinion Query, Creative Query');
  const [autoAppendContext, setAutoAppendContext] = useState(false);

  const handleRegexChange = (value, event) => {
    //console.log(event, value);
    setRegexRules(value);
    console.log(regexRules);
  }



  useEffect(() => {
    const fetchData = async () => {
      const data = await getLatestItem();
      setCurrentItem(data);
    };
    fetchData();
  }, []);

  const handleTaskDescriptionChange = (e) => {
    setTaskDescription(e.target.value);
  };

  const handleDetailAnswerChange = (e) => {
    setDetailAnswer(e.target.value);
    setCurrentItem({ ...currentItem, detailed_answer: e.target.value });
  };

  const handleDeleteContext = async (index) => {
    const itemToDelete = history[index];
    setHistory(history.filter((_, idx) => idx !== index));
  };

  const handleToggleAutoAppendContext = () => {
    setAutoAppendContext(!autoAppendContext);
  };


  const handleProcessedValueChange = (value) => {
    setProcessedValue(value.target.value);
    setCurrentItem({ ...currentItem, processed_value: value.target.value });
  }

  const handlePseudoLabeling = async () => {
    const historyData = history.map(item => `${item.text}, ${item.processed_value}`);

    const processedData = await pseudoLabelItem(currentItem.item_id, historyData, regexRules, taskDescription);
    const { processed_value, detailed_answer } = processedData;
    setDetailAnswer(detailed_answer);
    setProcessedValue(processed_value);
    setCurrentItem({ ...currentItem, processed_value });
  };

  const handleSave = async () => {
    const savedItem = await saveItem(currentItem);
    setHistory([...history, currentItem]);
    setProcessedValue('');
    // get latest item
    const data = await getLatestItem();
    setCurrentItem(data);

  };
  return (
    <ChakraProvider>
      <Container maxW="container.xl" p={1}>
        <Heading my={4}><span role="img" aria-label="label">🏷️</span> Fast ICL Labeler <span role="img" aria-label="rocket">🚀</span></Heading>

        <Flex>
          {/* Sidebar for Saved Contexts - Left Side */}
          <Box w="30%" borderWidth="1px" borderRadius="lg" p={4} mr={4}>

            <Heading size="md" p={2}>Saved Context</Heading>
            <Accordion allowToggle>
              {history.map((item, index) => (
                <AccordionItem key={index}>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Context {index + 1}



                    </Box>
                    <Button size="sm" onClick={() => handleDeleteContext(index)}>
                      <span role="img" aria-label="delete">❌</span>
                    </Button>

                    <AccordionIcon />

                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text fontSize="lg" fontFamily="monospace" p={2} borderRadius="md">
                      <strong>Input:</strong>
                    </Text>
                    <Code colorScheme="blue">
                      {item.text}
                    </Code>
                    <Text fontSize="lg" fontFamily="monospace" p={2} borderRadius="md">
                      <strong>Label Value:</strong>
                    </Text>
                    <Code colorScheme="green">
                      {item.processed_value}
                    </Code>

                  </AccordionPanel>

                </AccordionItem>
              ))}

            </Accordion>
          </Box>

          <Box w="70%">
            <Box p={4} borderWidth="1px" borderRadius="lg" overflow="hidden">

              <Text
                fontSize="lg"
                fontFamily="monospace"
                p={2}
                borderRadius="md"
              >
                <strong>Task Description</strong>

              </Text>

              <Textarea
                placeholder="Task Description"
                value={taskDescription}
                onChange={handleTaskDescriptionChange}
              />

              <Text
                fontSize="lg"
                fontFamily="monospace"
                p={2}
                borderRadius="md"
                textAlign="center"
              >
                <strong>LMQL Expression. Must contain string [ANSWER]</strong>
              </Text>
              <AceEditor
                mode="python"
                theme="monokai"
                fontSize={18}
                onChange={handleRegexChange}
                name="UNIQUE_ID_OF_DIV"
                defaultValue={`"Take a deep breath and think step by step. We can derive two conclusions"\n"- First, looking at the input, [REASON1]" where STOPS_AT(REASON1, ".")\n"- Second, [REASON2]" where STOPS_AT(REASON2, ".")\n"So, from these reasons, the answer is [ANSWER]"\nwhere ANSWER in set(["Ambiguous", "Factual Question", "Opinion Query", "Creative Query"])`}
                editorProps={{ $blockScrolling: true }}
                style={{ width: '100%', height: '300px' }} // Adjust as needed
              />
            </Box>

            {currentItem &&
              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Text
                  fontSize="lg"
                  fontFamily="monospace"
                  p={2}
                  borderRadius="md"
                >
                  <strong>Input:</strong>

                </Text>
                <Code colorScheme="blue">
                  {currentItem.text}
                </Code>
                <Text
                  fontSize="lg"
                  fontFamily="monospace"
                  p={2}
                  borderRadius="md">
                  <strong>Label Value:</strong>
                </Text>
                <Textarea
                  value={processedValue}
                  onChange={handleProcessedValueChange}
                  placeholder="Edit processed value here"
                  size="sm"
                />
                
                  <Text fontSize="lg" fontFamily="monospace" p={2} borderRadius="md">
                    <strong>Detailed Answer:</strong>
                  </Text>
                  <Textarea
                    value={detailAnswer}
                    onChange={handleDetailAnswerChange}
                    placeholder="Edit detail answer here"
                    size="sm"
                  />
                
                <Flex alignItems="center" mt={4}>
              <FormLabel htmlFor="auto-append-context" mb="0">
                Auto-Append Context
              </FormLabel>
              <Switch
                id="auto-append-context"
                isChecked={autoAppendContext}
                onChange={handleToggleAutoAppendContext}
              />
            </Flex>
              </Box>

            }

            <Flex justifyContent="center" mt={4} mb={4} alignItems="center">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button colorScheme="blue" onClick={handlePseudoLabeling} mr={3}>Process via LM</Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} ml={2}>
                <Button colorScheme="green" onClick={handleSave}>Save</Button>
              </motion.div>
            </Flex>


          </Box>
        </Flex>
      </Container>
    </ChakraProvider>
  );
}

export default App;
