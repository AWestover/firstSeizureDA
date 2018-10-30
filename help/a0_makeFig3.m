%% recreate figure 3

%% get life table (determines probability of death as function of age)
D = csvread('muDeath.csv'); 

%% changeable model parameters
age = 30; %  can change
MR = 5.4; %  can change -- different for different patients (mortality risk of seizures)
pAE = 22/100; % can change -- different for different patients (risk of AED side affects)
Efficacy = 0.75; % constant
u = [0.967 0.757 0.8647 0.6757 0]; % state utilities (constant)
baseCase = 1; % which base case's parameters to use


%% base case parameters

% NOTE: need to add in changes in utilities for the different base cases
% need treeAge code to identify exactly how we did this

recRisk = ones(1,100-age); 
if baseCase ==1
    recRisk((0:2)+age)= 21.9/100;      % (0-2 years)
    recRisk((2:5)+age) = 7.04/100;     % (2-5 years)
    recRisk((5:8)+age) = 0.68/100;     % (5-8 years)
    recRisk((8:500)+age) = 0.01/100; % (8+ years)

elseif baseCase ==2 | baseCase==3; 
    recRisk((0:2)+age)= 65.7/100;      % (0-2 years)
    recRisk((2:5)+age) = 21.12/100;    % (2-5 years)
    recRisk((5:8)+age) = 4.08/100;     % (5-8 years)
    recRisk((8:500)+age) = 0.03/100; % (8+ years)
end

%% initial state
p = [(1-pAE) 0 pAE 0 0]'; 
U = 0; % initial reward
for i = age:200
    
    P(i,:) = p'; 
    
    % death probabilities
    if i>=100; 
        d = ones(1,4)*D(end,2); 
    else
        d = ones(1,4)*D(i,2);
    end

    % probability of death if seizure free [states 1, 3]
    d(1) = 1-exp(-d(1)); 
    d(3) = 1-exp(-d(3));

    % probability of death if NOT seizure free [states 2, 4]
    temp = exp(d(1))-1;
    d(2)=MR*temp/(1+MR*temp);
    d(4)=MR*temp/(1+MR*temp); 

    % probability of recurrent seizures
    a21 = recRisk(i)*Efficacy; 
    a43 = recRisk(i)*Efficacy; 

    % probability of staying in same state
    a11 = 1-d(1)-a21; 
    a22 = 1-d(2); 
    a33 = 1-d(3)-a43;
    a44 = 1-d(4); 

    % transition matrix
    m = [a11 0 0 0 0;...
        a21 a22 0 0 0;...
        0 0 a33 0 0;...
        0 0 a43 a44 0;...
        d(1) d(2) d(3) d(4) 1]; 
    
    p = m*p; 
    
    disp(m)
    
    %% update utilities
    U = U + u*p;
    
end
disp(U); 

%% utilities
% No recurrent seizures	
% Without AED treatment  	1.00
% AED treatment without adverse side effects 	0.967
% AED treatment with adverse side effects 	0.8647
% Recurrent seizures	
% AED treatment without adverse side effects 	0.757
% AED treatment with adverse side effects 	0.6757
% Death	0



% base cases: qol-recSz, MR-recSz, probAdverseEvents, QOL-AE
% 0.75	5.4	22	0.90
% 0.75	5.4	22	0.90
% 0.90	1.5	80	0.80
c = [];
% P = fliplr(P); 
P = P(age:100,:); 
P2 = [P(:,5) P(:,4) P(:,2) P(:,3) P(:,1)]; 
P = P2; 
for i = 1:5
   c = [c; (sum(P(:,1:i),2))']; 
end
c = [c(1,:)*0; c]; 

t = age:100; 
plot(t,c','k');
axis square
axis tight

% color in between curves
colormap = cbrewer('seq', 'Blues',6); 
colormap = flipud(colormap); 
for i = 2:6; 
    yy = [c(i-1,:) fliplr(c(i,:))];
    xx = [t fliplr(t)]; 
    patch(xx,yy,colormap(i-1,:)); 
end

xlabel('Age [years]');
ylabel('Probability'); 
set(gcf,'color','w'); 
