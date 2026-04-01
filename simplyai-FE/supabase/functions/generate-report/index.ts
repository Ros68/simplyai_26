
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("API key for OpenAI is not set");
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the JSON from request body
    const { questionnaireId, userId } = await req.json();

    if (!questionnaireId || !userId) {
      throw new Error("Missing required parameters");
    }

    // Fetch questionnaire response
    const { data: response, error: responseError } = await supabaseClient
      .from('questionnaire_responses')
      .select('*')
      .eq('id', questionnaireId)
      .eq('user_id', userId)
      .maybeSingle();

    if (responseError) throw responseError;
    if (!response) throw new Error("Questionnaire response not found");

    // Fetch questionnaire config
    const { data: config, error: configError } = await supabaseClient
      .from('questionnaire_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) throw configError;
    if (!config) throw new Error("Questionnaire configuration not found");

    // Fetch prompt template and shortcodes configuration
    const { data: aiConfig, error: aiConfigError } = await supabaseClient
      .from('ai_prompt_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Prepare the data for OpenAI
    const questionsWithAnswers = formatQuestionsAndAnswers(config.questions, response.answers);

    // Determine what shortcodes are available
    const shortcodesToGenerate = getShortcodeConfiguration(aiConfig);

    // Generate the system prompt
    const systemPrompt = aiConfig?.systemPrompt || `You are an expert analyst specializing in personal and professional development. 
    Your task is to analyze questionnaire responses and create a comprehensive, personalized report.
    The report should be in Italian and include sections for text content, chart data, and table data.
    For each section, chart, or table explicitly identified in the shortcodes, generate appropriate content.`;

    // Generate the user prompt with the questionnaire data
    const userPrompt = aiConfig?.userPrompt || `Based on the following questionnaire responses, generate a comprehensive report.
    
    QUESTIONNAIRE DATA:
    ${JSON.stringify(questionsWithAnswers, null, 2)}
    
    GENERATE CONTENT FOR THE FOLLOWING SHORTCODES:
    ${JSON.stringify(shortcodesToGenerate, null, 2)}
    
    Format your response as a JSON object with separate sections for text content, chart data, and table data keyed by their shortcodes.
    
    Make the report personalized, insightful, and actionable. Ensure all content is in Italian.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig?.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: aiConfig?.temperature || 0.7,
        max_tokens: aiConfig?.maxTokens || 2000,
      }),
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || openAIData.choices.length === 0) {
      throw new Error("Failed to generate report from OpenAI");
    }

    // Parse the JSON response from OpenAI
    const reportContent = JSON.parse(openAIData.choices[0].message.content);

    // Save the report
    const { data: reportData, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        user_id: userId,
        questionnaire_id: questionnaireId,
        title: "Report generato da AI",
        content: reportContent,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (reportError) throw reportError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: reportContent,
        reportId: reportData?.id 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in generate-report function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper function to format questions and answers
function formatQuestionsAndAnswers(questions: any[], answers: Record<string, any>) {
  const result = [];
  
  for (const question of questions) {
    const answer = answers[question.id];
    
    // Skip questions without answers
    if (answer === undefined) continue;
    
    let formattedAnswer;
    
    // Format the answer based on question type
    switch (question.type) {
      case 'single_choice':
      case 'dropdown':
        const option = question.options?.find((opt: any) => opt.value === answer);
        formattedAnswer = option ? option.label : answer;
        break;
      case 'multiple_choice':
        if (Array.isArray(answer)) {
          formattedAnswer = answer.map(val => {
            const option = question.options?.find((opt: any) => opt.value === val);
            return option ? option.label : val;
          });
        } else {
          formattedAnswer = answer;
        }
        break;
      case 'scale':
        formattedAnswer = {
          value: answer,
          min: question.min || 1,
          max: question.max || 5,
          minLabel: question.minLabel,
          maxLabel: question.maxLabel
        };
        break;
      default:
        formattedAnswer = answer;
    }
    
    result.push({
      id: question.id,
      text: question.text,
      type: question.type,
      answer: formattedAnswer,
      score: typeof answer === 'number' ? answer : null
    });
  }
  
  return result;
}

// Helper function to extract shortcode configuration
function getShortcodeConfiguration(aiConfig: any) {
  if (!aiConfig || !aiConfig.shortcodes) {
    // Default shortcodes if none are configured
    return {
      textSections: [
        { shortcode: '[section_summary_001]', title: 'Riepilogo' },
        { shortcode: '[section_strengths_002]', title: 'Punti di forza' },
        { shortcode: '[section_improvement_003]', title: 'Aree di miglioramento' }
      ],
      chartSections: [
        { shortcode: '[chart_scores_001]', title: 'Punteggi per categoria', type: 'bar' },
        { shortcode: '[chart_distribution_002]', title: 'Distribuzione risposte', type: 'pie' }
      ],
      tableSections: [
        { shortcode: '[table_results_001]', title: 'Risultati dettagliati', type: 'striped' }
      ]
    };
  }
  
  return aiConfig.shortcodes;
}
