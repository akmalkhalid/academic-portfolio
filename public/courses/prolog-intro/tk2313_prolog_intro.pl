/* ==============================================================
   TK2313 Artificial Intelligence
   Introduction to Prolog: demo knowledge base
   Load it:   ?- consult('tk2313_prolog_intro.pl').
   Reload after editing:   ?- make.
   ============================================================== */

% ---------- 1. FACTS: family ----------
parent(ali, aminah).
parent(ali, badrul).
parent(siti, aminah).
parent(siti, badrul).
parent(aminah, danial).
parent(badrul, farah).
parent(danial, hana).

male(ali).
male(badrul).
male(danial).

female(siti).
female(aminah).
female(farah).
female(hana).

% ---------- 2. FACTS: food & numbers ----------
likes(aminah, nasi_lemak).
likes(badrul, roti_canai).
likes(danial, nasi_lemak).
likes(farah, satay).

age(ali, 72).
age(siti, 68).
age(aminah, 45).
age(badrul, 41).
age(danial, 24).
age(farah, 16).
age(hana, 2).

% ---------- 3. RULES ----------
father(F, C)      :- parent(F, C), male(F).
mother(M, C)      :- parent(M, C), female(M).
grandparent(G, C) :- parent(G, P), parent(P, C).
sibling(X, Y)     :- parent(P, X), parent(P, Y), X \= Y.
same_taste(X, Y)  :- likes(X, Food), likes(Y, Food), X \= Y.

adult(X) :- age(X, A), A >= 18.
teen(X)  :- age(X, A), A >= 13, A =< 19.
older(X, Y) :- age(X, A), age(Y, B), A > B.

% OR: two clauses = two ways to be true
guardian(G, C) :- parent(G, C).
guardian(G, C) :- grandparent(G, C).

% ---------- 4. RECURSION ----------
ancestor(A, D) :- parent(A, D).                  % base case
ancestor(A, D) :- parent(A, X), ancestor(X, D).  % recursive case

% ---------- 5. LISTS ----------
my_length([], 0).
my_length([_|T], N) :- my_length(T, N0), N is N0 + 1.

my_sum([], 0).
my_sum([H|T], S) :- my_sum(T, S0), S is H + S0.

% ---------- 6. OUTPUT ----------
greet(Name) :- format("Selamat datang, ~w!~n", [Name]).
