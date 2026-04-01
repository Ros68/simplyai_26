// import React, { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Loader2, CheckCircle2, XCircle } from "lucide-react";
// import { API_BASE_URL } from "@/config/api";
// import Navbar from "@/components/Navbar";

// const VerifyEmail = () => {
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");
//   const navigate = useNavigate();

//   const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
//   const [message, setMessage] = useState("Verifica in corso...");

//   useEffect(() => {
//     const verifyUserEmail = async () => {
//       if (!token) {
//         setStatus("error");
//         setMessage("Token di verifica mancante o non valido.");
//         return;
//       }

//       try {
//         const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`);
//         const data = await response.json();

//         if (data.success) {
//           setStatus("success");
//           setMessage(data.message || "Email verificata con successo!");
//         } else {
//           setStatus("error");
//           setMessage(data.message || "Il link di verifica è scaduto o non è valido.");
//         }
//       } catch (error) {
//         setStatus("error");
//         setMessage("Errore di connessione durante la verifica. Riprova più tardi.");
//       }
//     };

//     verifyUserEmail();
//   }, [token]);

//   return (
//     <div className="flex flex-col min-h-screen">
//       <Navbar />
//       <div className="flex-grow flex items-center justify-center p-4 bg-[var(--color-frame-bg, #f8f7ff)]">
//         <Card className="w-full max-w-md p-6 text-center shadow-lg border-0">
//           <CardHeader>
//             <div className="flex justify-center mb-4">
//               {status === "loading" && (
//                 <Loader2 className="h-16 w-16 animate-spin text-[var(--color-primary)]" />
//               )}
//               {status === "success" && (
//                 <CheckCircle2 className="h-16 w-16 text-green-500" />
//               )}
//               {status === "error" && (
//                 <XCircle className="h-16 w-16 text-red-500" />
//               )}
//             </div>
//             <CardTitle className="text-2xl font-bold text-gray-900">
//               {status === "loading" && "Verifica in corso..."}
//               {status === "success" && "Email Verificata!"}
//               {status === "error" && "Verifica Fallita"}
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-gray-600 mb-8">{message}</p>
            
//             {status !== "loading" && (
//               <Button 
//                 onClick={() => navigate('/login')} 
//                 className="w-full bg-[var(--color-primary)] hover:opacity-90 text-white"
//               >
//                 Vai al Login
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default VerifyEmail;